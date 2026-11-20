"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { DEFAULT_COURSES, TOTAL_UNITS, VIZE_UNIT_LIMIT } from "@/data/courses";
import { classifyCourseCategory, makeUnitKey } from "@/lib/classifier";
import {
  getInitialCoachState,
  isLocalLoopbackHost,
  loadAiPreference,
  loadClientAiOverride,
  loadCoachState,
  loadEvrenModelPreference,
  loadThemePreference,
  parseCoachStateJson,
  saveAiPreference,
  saveClientAiOverride,
  saveCoachState,
  saveCoachStateLocalOnly,
  saveEvrenModelPreference,
  saveThemePreference,
  ThemeMode,
} from "@/lib/storage";
import {
  AiProviderPreference,
  ClientAiOverride,
  CoachState,
  Course,
  CourseCategory,
  ExamDates,
  QuizAttempt,
  ReviewItem,
  StudyGuide,
  UnitRecord,
} from "@/types/coach";

export type ActiveView = "dashboard" | "course" | "exam";
export type CourseSubTab = "upload" | "guide" | "quiz";

const SPACED_INTERVAL_DAYS = [1, 3, 7, 14] as const;

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

interface CourseProgress {
  vizeCompleted: number;
  vizeTotal: number;
  vizePercent: number;
  finalCompleted: number;
  finalTotal: number;
  finalPercent: number;
}

interface CoachContextValue {
  hydrated: boolean;
  theme: ThemeMode;
  toggleTheme: () => void;
  aiPreference: AiProviderPreference;
  setAiPreference: (pref: AiProviderPreference) => void;
  evrenModelPreference: string;
  setEvrenModelPreference: (model: string) => void;
  clientAiOverride: ClientAiOverride | undefined;
  setClientAiOverride: (cfg: ClientAiOverride | null) => void;
  state: CoachState;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedCourseId: string;
  selectedUnitNumber: number;
  activeSubTab: CourseSubTab;
  setActiveSubTab: (tab: CourseSubTab) => void;
  selectCourse: (
    courseId: string,
    unitNumber?: number,
    subTab?: CourseSubTab
  ) => void;
  selectUnit: (unitNumber: number) => void;
  selectedCourse: Course | null;
  currentUnitRecord: UnitRecord;
  addCourse: (
    name: string,
    category?: CourseCategory,
    description?: string,
    code?: string
  ) => Course;
  deleteCourse: (courseId: string) => void;
  loadSampleCurriculum: () => void;
  updateUnitText: (
    courseId: string,
    unitNumber: number,
    rawText: string,
    fileName?: string,
    totalPages?: number
  ) => void;
  updateUnitContentMode: (
    courseId: string,
    unitNumber: number,
    contentMode: "auto" | "full_unit" | "summary"
  ) => void;
  toggleUnitCompleted: (courseId: string, unitNumber: number) => void;
  saveStudyGuide: (
    courseId: string,
    unitNumber: number,
    guide: StudyGuide
  ) => void;
  recordQuizAttempt: (attempt: QuizAttempt) => void;
  advanceReviewItem: (id: string) => void;
  resolveReviewItem: (id: string) => void;
  deleteReviewItem: (id: string) => void;
  pendingWeakTopics: string[];
  startWeakTopicQuiz: (
    courseId: string,
    unitNumber: number,
    topics: string[]
  ) => void;
  clearPendingWeakTopics: () => void;
  updateExamDates: (dates: ExamDates) => void;
  getCourseProgress: (courseId: string) => CourseProgress;
  getUnitRecord: (courseId: string, unitNumber: number) => UnitRecord;
}

const CoachContext = createContext<CoachContextValue | null>(null);

const SERVER_STATE_SNAPSHOT: CoachState = getInitialCoachState();
let clientStateCache: CoachState | null = null;
const stateListeners = new Set<() => void>();

function subscribeState(listener: () => void): () => void {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
}

function getClientStateSnapshot(): CoachState {
  if (!clientStateCache) {
    clientStateCache = loadCoachState();
  }
  return clientStateCache;
}

function getServerStateSnapshot(): CoachState {
  return SERVER_STATE_SNAPSHOT;
}

function updateCoachState(updater: (prev: CoachState) => CoachState): void {
  const current = getClientStateSnapshot();
  const next = updater(current);
  clientStateCache = next;
  saveCoachState(next);
  stateListeners.forEach((l) => l());
}

function applyHydratedDiskState(next: CoachState): void {
  clientStateCache = next;
  saveCoachStateLocalOnly(next);
  stateListeners.forEach((l) => l());
}

function createPrefStore<T>(
  serverFallback: T,
  loader: () => T,
  saver: (val: T) => void
) {
  let cache: T | null = null;
  const listeners = new Set<() => void>();
  return {
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getClientSnapshot(): T {
      if (cache === null) {
        cache = loader();
      }
      return cache;
    },
    getServerSnapshot(): T {
      return serverFallback;
    },
    set(nextVal: T): void {
      cache = nextVal;
      saver(nextVal);
      listeners.forEach((l) => l());
    },
  };
}

const themeStore = createPrefStore<ThemeMode>(
  "dark",
  loadThemePreference,
  saveThemePreference
);

const aiPrefStore = createPrefStore<AiProviderPreference>(
  "auto",
  loadAiPreference,
  saveAiPreference
);

const evrenModelStore = createPrefStore<string>(
  "",
  loadEvrenModelPreference,
  saveEvrenModelPreference
);

const clientAiOverrideStore = createPrefStore<ClientAiOverride | undefined>(
  undefined,
  loadClientAiOverride,
  (val) => saveClientAiOverride(val ?? null)
);

const emptySubscribe = () => () => {};

function createEmptyUnit(unitNumber: number): UnitRecord {
  return {
    unitNumber,
    rawText: "",
    completed: false,
    quizHistory: [],
    updatedAt: "",
  };
}

export function CoachProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const state = useSyncExternalStore(
    subscribeState,
    getClientStateSnapshot,
    getServerStateSnapshot
  );

  const theme = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getClientSnapshot,
    themeStore.getServerSnapshot
  );

  const aiPreference = useSyncExternalStore(
    aiPrefStore.subscribe,
    aiPrefStore.getClientSnapshot,
    aiPrefStore.getServerSnapshot
  );

  const evrenModelPreference = useSyncExternalStore(
    evrenModelStore.subscribe,
    evrenModelStore.getClientSnapshot,
    evrenModelStore.getServerSnapshot
  );

  const clientAiOverride = useSyncExternalStore(
    clientAiOverrideStore.subscribe,
    clientAiOverrideStore.getClientSnapshot,
    clientAiOverrideStore.getServerSnapshot
  );

  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    SERVER_STATE_SNAPSHOT.courses[0]?.id ?? ""
  );
  const [selectedUnitNumber, setSelectedUnitNumber] = useState<number>(1);
  const [activeSubTab, setActiveSubTab] = useState<CourseSubTab>("upload");
  const [pendingWeakTopics, setPendingWeakTopics] = useState<string[]>([]);

  // Tema değiştiğinde DOM üzerindeki .dark sınıfını senkronize et
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Yerel coach-data.json dosyasından (Electron veya localhost sunucusundan) veriyi senkronize et
  useEffect(() => {
    let active = true;

    if (window.electronDesktop?.isDesktop) {
      void window.electronDesktop.readState().then((raw) => {
        if (!active || !raw) return;
        const diskState = parseCoachStateJson(raw);
        if (!diskState) return;
        applyHydratedDiskState(diskState);
      });
      return () => {
        active = false;
      };
    }

    if (!isLocalLoopbackHost()) {
      return;
    }

    void fetch("/api/state")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { raw?: string | null } | null) => {
        if (!active || !data?.raw) return;
        const diskState = parseCoachStateJson(data.raw);
        if (!diskState) return;
        const hasDiskData =
          diskState.courses.length > 0 ||
          Object.keys(diskState.units).length > 0 ||
          diskState.reviewItems.length > 0;
        if (hasDiskData) {
          applyHydratedDiskState(diskState);
        }
      })
      .catch(() => {
        // Offline / static ortamda localStorage ile devam et
      });

    return () => {
      active = false;
    };
  }, []);

  const toggleTheme = useCallback(() => {
    const current = themeStore.getClientSnapshot();
    themeStore.set(current === "dark" ? "light" : "dark");
  }, []);

  const setAiPreference = useCallback((pref: AiProviderPreference) => {
    aiPrefStore.set(pref);
  }, []);

  const setEvrenModelPreference = useCallback((model: string) => {
    evrenModelStore.set(model);
  }, []);

  const setClientAiOverride = useCallback((cfg: ClientAiOverride | null) => {
    clientAiOverrideStore.set(cfg ?? undefined);
  }, []);

  const selectCourse = useCallback(
    (courseId: string, unitNumber?: number, subTab?: CourseSubTab) => {
      setSelectedCourseId(courseId);
      if (unitNumber !== undefined) {
        setSelectedUnitNumber(unitNumber);
      }
      if (subTab !== undefined) {
        setActiveSubTab(subTab);
      }
      setActiveView("course");
    },
    []
  );

  const selectUnit = useCallback((unitNumber: number) => {
    setSelectedUnitNumber(unitNumber);
  }, []);

  const getUnitRecord = useCallback(
    (courseId: string, unitNumber: number): UnitRecord => {
      const key = makeUnitKey(courseId, unitNumber);
      return state.units[key] ?? createEmptyUnit(unitNumber);
    },
    [state.units]
  );

  const selectedCourse = useMemo(() => {
    return (
      state.courses.find((c) => c.id === selectedCourseId) ??
      state.courses[0] ??
      null
    );
  }, [state.courses, selectedCourseId]);

  const currentUnitRecord = useMemo(() => {
    if (!selectedCourse) return createEmptyUnit(selectedUnitNumber);
    return getUnitRecord(selectedCourse.id, selectedUnitNumber);
  }, [selectedCourse, selectedUnitNumber, getUnitRecord]);

  const addCourse = useCallback(
    (
      name: string,
      category?: CourseCategory,
      description?: string,
      code?: string
    ): Course => {
      const trimmed = name.trim();
      const detected = category ?? classifyCourseCategory(trimmed, description);
      const id = `course-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
      const cleanCode = code?.trim()
        ? code.trim().toLocaleUpperCase("tr-TR")
        : "DERS";
      const newCourse: Course = {
        id,
        name: trimmed,
        code: cleanCode,
        category: detected,
        description:
          description?.trim() ||
          (detected === "teknik"
            ? "Teknik / kodlama odaklı çalışma dersi."
            : "Sözel / kavramsal odaklı çalışma dersi."),
        isCustom: true,
      };
      updateCoachState((prev) => ({
        ...prev,
        courses: [...prev.courses, newCourse],
      }));
      return newCourse;
    },
    []
  );

  const deleteCourse = useCallback(
    (courseId: string) => {
      updateCoachState((prev) => {
        const nextCourses = prev.courses.filter((c) => c.id !== courseId);
        const nextUnits: CoachState["units"] = {};
        for (const [k, u] of Object.entries(prev.units)) {
          if (!k.startsWith(`${courseId}::`)) {
            nextUnits[k] = u;
          }
        }
        return {
          ...prev,
          courses: nextCourses,
          units: nextUnits,
          reviewItems: prev.reviewItems.filter((r) => r.courseId !== courseId),
        };
      });

      if (selectedCourseId === courseId) {
        setSelectedCourseId("");
        setActiveView("dashboard");
      }
    },
    [selectedCourseId]
  );

  const loadSampleCurriculum = useCallback(() => {
    updateCoachState((prev) => {
      if (prev.courses.length > 0) return prev;
      return {
        ...prev,
        courses: DEFAULT_COURSES,
      };
    });
  }, []);

  const updateUnitText = useCallback(
    (
      courseId: string,
      unitNumber: number,
      rawText: string,
      fileName?: string,
      totalPages?: number
    ) => {
      const key = makeUnitKey(courseId, unitNumber);
      updateCoachState((prev) => {
        const existing = prev.units[key] ?? createEmptyUnit(unitNumber);
        return {
          ...prev,
          units: {
            ...prev.units,
            [key]: {
              ...existing,
              rawText,
              fileName: fileName !== undefined ? fileName : existing.fileName,
              totalPages:
                totalPages !== undefined ? totalPages : existing.totalPages,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      });
    },
    []
  );

  const updateUnitContentMode = useCallback(
    (
      courseId: string,
      unitNumber: number,
      contentMode: "auto" | "full_unit" | "summary"
    ) => {
      const key = makeUnitKey(courseId, unitNumber);
      updateCoachState((prev) => {
        const existing = prev.units[key] ?? createEmptyUnit(unitNumber);
        return {
          ...prev,
          units: {
            ...prev.units,
            [key]: {
              ...existing,
              contentMode,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      });
    },
    []
  );

  const toggleUnitCompleted = useCallback(
    (courseId: string, unitNumber: number) => {
      const key = makeUnitKey(courseId, unitNumber);
      updateCoachState((prev) => {
        const existing = prev.units[key] ?? createEmptyUnit(unitNumber);
        return {
          ...prev,
          units: {
            ...prev.units,
            [key]: {
              ...existing,
              completed: !existing.completed,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      });
    },
    []
  );

  const saveStudyGuide = useCallback(
    (courseId: string, unitNumber: number, guide: StudyGuide) => {
      const key = makeUnitKey(courseId, unitNumber);
      updateCoachState((prev) => {
        const existing = prev.units[key] ?? createEmptyUnit(unitNumber);
        return {
          ...prev,
          units: {
            ...prev.units,
            [key]: {
              ...existing,
              guide,
              completed: true,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      });
    },
    []
  );

  const recordQuizAttempt = useCallback((attempt: QuizAttempt) => {
    const key = makeUnitKey(attempt.courseId, attempt.unitNumber);
    updateCoachState((prev) => {
      const existing = prev.units[key] ?? createEmptyUnit(attempt.unitNumber);
      const courseName =
        prev.courses.find((c) => c.id === attempt.courseId)?.name ??
        attempt.courseId;

      // Yanlış yapılan soruları otomatik olarak "Yanlış Defteri"ne (1-3-7-14 gün tekrar takvimiyle) ekle
      const nextReviewItems: ReviewItem[] = [...prev.reviewItems];
      for (const question of attempt.questions) {
        const userAns = attempt.answers[question.id];
        if (!userAns || userAns === "BOS" || userAns === question.correctKey) {
          continue;
        }
        const qUnit = question.unitNumber || attempt.unitNumber;
        const wrongOption = question.options.find((opt) => opt.key === userAns);
        const correctOption = question.options.find(
          (opt) => opt.key === question.correctKey
        );
        const alreadyOpen = nextReviewItems.some(
          (item) =>
            !item.resolved &&
            item.courseId === attempt.courseId &&
            item.unitNumber === qUnit &&
            item.topic.toLowerCase() === question.topic.toLowerCase()
        );
        if (!alreadyOpen) {
          nextReviewItems.unshift({
            id: `rev-${Date.now().toString(36)}-${Math.random()
              .toString(36)
              .slice(2, 6)}`,
            courseId: attempt.courseId,
            courseName,
            unitNumber: qUnit,
            topic: question.topic,
            questionPreview: question.question,
            wrongChoice: wrongOption
              ? `${wrongOption.key}) ${wrongOption.text}`
              : String(userAns),
            correctAnswerSummary: correctOption
              ? `${correctOption.key}) ${correctOption.text} — ${correctOption.explanation}`
              : "",
            resolved: false,
            reviewStage: 0,
            nextReviewAt: addDaysIso(SPACED_INTERVAL_DAYS[0]),
            createdAt: new Date().toISOString(),
          });
        }
      }

      return {
        ...prev,
        units: {
          ...prev.units,
          [key]: {
            ...existing,
            completed: true,
            quizHistory: [attempt, ...existing.quizHistory],
            updatedAt: new Date().toISOString(),
          },
        },
        reviewItems: nextReviewItems,
      };
    });
  }, []);

  const advanceReviewItem = useCallback((id: string) => {
    updateCoachState((prev) => ({
      ...prev,
      reviewItems: prev.reviewItems.map((item) => {
        if (item.id !== id) return item;
        const nextStage = (item.reviewStage ?? 0) + 1;
        if (nextStage >= SPACED_INTERVAL_DAYS.length) {
          return {
            ...item,
            reviewStage: SPACED_INTERVAL_DAYS.length,
            resolved: true,
            lastReviewedAt: new Date().toISOString(),
          };
        }
        return {
          ...item,
          reviewStage: nextStage,
          nextReviewAt: addDaysIso(SPACED_INTERVAL_DAYS[nextStage]),
          lastReviewedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const startWeakTopicQuiz = useCallback(
    (courseId: string, unitNumber: number, topics: string[]) => {
      setSelectedCourseId(courseId);
      setSelectedUnitNumber(unitNumber);
      setPendingWeakTopics(topics);
      setActiveSubTab("quiz");
      setActiveView("course");
    },
    []
  );

  const clearPendingWeakTopics = useCallback(() => {
    setPendingWeakTopics([]);
  }, []);

  const resolveReviewItem = useCallback((id: string) => {
    updateCoachState((prev) => ({
      ...prev,
      reviewItems: prev.reviewItems.map((item) =>
        item.id === id ? { ...item, resolved: !item.resolved } : item
      ),
    }));
  }, []);

  const deleteReviewItem = useCallback((id: string) => {
    updateCoachState((prev) => ({
      ...prev,
      reviewItems: prev.reviewItems.filter((item) => item.id !== id),
    }));
  }, []);

  const updateExamDates = useCallback((dates: ExamDates) => {
    updateCoachState((prev) => ({
      ...prev,
      examDates: dates,
    }));
  }, []);

  const getCourseProgress = useCallback(
    (courseId: string): CourseProgress => {
      let vizeCompleted = 0;
      let finalCompleted = 0;

      for (let u = 1; u <= TOTAL_UNITS; u++) {
        const rec = state.units[makeUnitKey(courseId, u)];
        if (rec?.completed) {
          finalCompleted += 1;
          if (u <= VIZE_UNIT_LIMIT) {
            vizeCompleted += 1;
          }
        }
      }

      return {
        vizeCompleted,
        vizeTotal: VIZE_UNIT_LIMIT,
        vizePercent: Math.round((vizeCompleted / VIZE_UNIT_LIMIT) * 100),
        finalCompleted,
        finalTotal: TOTAL_UNITS,
        finalPercent: Math.round((finalCompleted / TOTAL_UNITS) * 100),
      };
    },
    [state.units]
  );

  const value = useMemo<CoachContextValue>(
    () => ({
      hydrated,
      theme,
      toggleTheme,
      aiPreference,
      setAiPreference,
      evrenModelPreference,
      setEvrenModelPreference,
      clientAiOverride,
      setClientAiOverride,
      state,
      activeView,
      setActiveView,
      selectedCourseId,
      selectedUnitNumber,
      activeSubTab,
      setActiveSubTab,
      selectCourse,
      selectUnit,
      selectedCourse,
      currentUnitRecord,
      addCourse,
      deleteCourse,
      loadSampleCurriculum,
      updateUnitText,
      updateUnitContentMode,
      toggleUnitCompleted,
      saveStudyGuide,
      recordQuizAttempt,
      advanceReviewItem,
      resolveReviewItem,
      deleteReviewItem,
      pendingWeakTopics,
      startWeakTopicQuiz,
      clearPendingWeakTopics,
      updateExamDates,
      getCourseProgress,
      getUnitRecord,
    }),
    [
      hydrated,
      theme,
      toggleTheme,
      aiPreference,
      setAiPreference,
      evrenModelPreference,
      setEvrenModelPreference,
      clientAiOverride,
      setClientAiOverride,
      state,
      activeView,
      selectedCourseId,
      selectedUnitNumber,
      activeSubTab,
      selectCourse,
      selectUnit,
      selectedCourse,
      currentUnitRecord,
      addCourse,
      deleteCourse,
      loadSampleCurriculum,
      updateUnitText,
      updateUnitContentMode,
      toggleUnitCompleted,
      saveStudyGuide,
      recordQuizAttempt,
      advanceReviewItem,
      resolveReviewItem,
      deleteReviewItem,
      pendingWeakTopics,
      startWeakTopicQuiz,
      clearPendingWeakTopics,
      updateExamDates,
      getCourseProgress,
      getUnitRecord,
    ]
  );

  return (
    <CoachContext.Provider value={value}>{children}</CoachContext.Provider>
  );
}

export function useCoach(): CoachContextValue {
  const ctx = useContext(CoachContext);
  if (!ctx) {
    throw new Error("useCoach must be used inside CoachProvider");
  }
  return ctx;
}
