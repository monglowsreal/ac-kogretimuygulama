"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  CheckSquare,
  Clock,
  FileCheck2,
  Loader2,
  Play,
  RotateCcw,
  Square,
  XCircle,
} from "lucide-react";
import { AnswerKeySection } from "@/components/AnswerKeySection";
import { useCoach } from "@/context/CoachContext";
import { calculateAofNet } from "@/lib/classifier";
import { getCourseUnitConfig } from "@/lib/course-units";
import {
  AiGenerationMeta,
  QuizAttempt,
  QuizOptionKey,
  QuizQuestion,
} from "@/types/coach";

function createExamAttemptRecord(
  courseId: string,
  unitNumber: number,
  questions: QuizQuestion[],
  answers: Record<string, QuizOptionKey | "BOS">,
  stats: ReturnType<typeof calculateAofNet>
): QuizAttempt {
  const now = new Date();
  return {
    id: `exam-${now.getTime().toString(36)}`,
    courseId,
    unitNumber,
    questions,
    answers,
    ...stats,
    completedAt: now.toISOString(),
  };
}

export function MockExamView() {
  const {
    state,
    getUnitRecord,
    recordQuizAttempt,
    setActiveView,
    aiPreference,
    evrenModelPreference,
    clientAiOverride,
  } = useCoach();

  const [courseId, setCourseId] = useState(state.courses[0]?.id ?? "");
  const selectedCourse =
    state.courses.find((c) => c.id === courseId) ?? state.courses[0];
  const unitCfg = selectedCourse ? getCourseUnitConfig(selectedCourse) : null;

  const availableUnits =
    selectedCourse && unitCfg
      ? unitCfg.unitNumbers.filter(
          (u) => getUnitRecord(selectedCourse.id, u).rawText.trim().length >= 50
        )
      : [];

  const [customUnitsByCourse, setCustomUnitsByCourse] = useState<
    Record<string, number[]>
  >({});
  const selectedUnits = selectedCourse
    ? (customUnitsByCourse[selectedCourse.id]?.filter((u) =>
        availableUnits.includes(u)
      ) ?? availableUnits)
    : [];
  const [questionCount, setQuestionCount] = useState<10 | 15 | 20>(20);
  const [revealMode, setRevealMode] = useState<"immediate" | "end">(
    "immediate"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [examQuestions, setExamQuestions] = useState<QuizQuestion[] | null>(
    null
  );
  const [answers, setAnswers] = useState<Record<string, QuizOptionKey | "BOS">>(
    {}
  );
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [examAiMeta, setExamAiMeta] = useState<AiGenerationMeta | null>(null);
  const [submittedStats, setSubmittedStats] = useState<ReturnType<
    typeof calculateAofNet
  > | null>(null);

  // Deneme sınavı sayacı
  useEffect(() => {
    if (!examQuestions || submittedStats) return;
    if (remainingSeconds <= 0) return;
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [examQuestions, submittedStats, remainingSeconds]);

  const toggleUnit = (u: number) => {
    if (!selectedCourse) return;
    const current = customUnitsByCourse[selectedCourse.id] ?? availableUnits;
    const next = current.includes(u)
      ? current.filter((x) => x !== u)
      : [...current, u].sort((a, b) => a - b);
    setCustomUnitsByCourse((prev) => ({
      ...prev,
      [selectedCourse.id]: next,
    }));
  };

  const applyPreset = (mode: "vize" | "final" | "all") => {
    if (!selectedCourse || !unitCfg) return;
    const filtered = availableUnits.filter((u) => {
      if (mode === "vize") return unitCfg.vizeSet.has(u);
      if (mode === "final") return unitCfg.finalSet.has(u);
      return true;
    });
    setCustomUnitsByCourse((prev) => ({
      ...prev,
      [selectedCourse.id]: filtered,
    }));
  };

  if (!selectedCourse) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-xs dark:border-slate-700 dark:bg-slate-900">
        <FileCheck2 className="mx-auto h-10 w-10 text-indigo-500" />
        <h2 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
          Deneme Sınavı İçin Önce Ders Ekleyin
        </h2>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          Sol panelden veya ana panelden kendi dersini ekleyip en az 1 ünite
          içeriği yüklediğinde çok üniteli deneme sınavı başlatabilirsin.
        </p>
        <button
          type="button"
          onClick={() => setActiveView("dashboard")}
          className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
        >
          Panele Dön ve Ders Ekle
        </button>
      </div>
    );
  }

  const handleStartExam = async () => {
    if (!selectedCourse || selectedUnits.length === 0) return;
    setIsLoading(true);
    setError(null);
    setSubmittedStats(null);

    try {
      const unitsPayload = selectedUnits.map((u) => {
        const rec = getUnitRecord(selectedCourse.id, u);
        return {
          unitNumber: u,
          unitText: rec.rawText,
          studyGuide: rec.guide,
        };
      });

      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName: selectedCourse.name,
          category: selectedCourse.category,
          questionCount,
          quizScope: "full_text",
          unitsPayload,
          preferredProvider: aiPreference,
          evrenModel: evrenModelPreference || undefined,
          clientAiConfig: clientAiOverride,
        }),
      });

      const data = (await res.json()) as {
        questions?: QuizQuestion[];
        aiMeta?: AiGenerationMeta;
        error?: string;
      };

      if (!res.ok || !data.questions || data.questions.length === 0) {
        throw new Error(data.error || "Deneme sınavı üretilemedi.");
      }

      setExamAiMeta(data.aiMeta ?? null);
      setExamQuestions(data.questions);
      setAnswers({});
      setRemainingSeconds(data.questions.length * 90); // AÖF standart 1.5 dk / soru
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Sınav oluşturulurken hata oluştu."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitExam = () => {
    if (!examQuestions || !selectedCourse) return;
    const stats = calculateAofNet(examQuestions, answers);
    recordQuizAttempt(
      createExamAttemptRecord(
        selectedCourse.id,
        selectedUnits[0] || 1,
        examQuestions,
        answers,
        stats
      )
    );
    setSubmittedStats(stats);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Sınav Sonuç + Konu Başarısı + Cevap Anahtarı
  if (examQuestions && submittedStats && selectedCourse) {
    const topicMap = new Map<string, { total: number; correct: number }>();
    for (const q of examQuestions) {
      const key = q.unitNumber ? `Ünite ${q.unitNumber} • ${q.topic}` : q.topic;
      const entry = topicMap.get(key) ?? { total: 0, correct: 0 };
      entry.total += 1;
      if (answers[q.id] === q.correctKey) entry.correct += 1;
      topicMap.set(key, entry);
    }
    const topicRows = Array.from(topicMap.entries());
    const weakRows = topicRows.filter(([, v]) => v.correct < v.total);

    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Award className="h-7 w-7" />
            </div>
            <h2 className="mt-3 text-xl font-extrabold text-slate-900 dark:text-white">
              Deneme Sınavı Tamamlandı!
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {selectedCourse.name} • Üniteler:{" "}
              {selectedUnits.join(", ")} (Resmi AÖF 4 Yanlış 1 Doğru Kuralı)
            </p>

            <div className="mt-5 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="rounded-xl bg-emerald-500/10 p-3">
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Doğru
                </div>
                <div className="text-2xl font-extrabold text-emerald-600">
                  {submittedStats.correctCount}
                </div>
              </div>
              <div className="rounded-xl bg-rose-500/10 p-3">
                <div className="text-[11px] text-rose-700 dark:text-rose-300">
                  Yanlış
                </div>
                <div className="text-2xl font-extrabold text-rose-600">
                  {submittedStats.wrongCount}
                </div>
              </div>
              <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
                <div className="text-[11px] text-slate-600 dark:text-slate-300">
                  Boş
                </div>
                <div className="text-2xl font-extrabold text-slate-700 dark:text-slate-200">
                  {submittedStats.blankCount}
                </div>
              </div>
              <div className="rounded-xl bg-indigo-500/10 p-3">
                <div className="text-[11px] text-indigo-700 dark:text-indigo-300">
                  AÖF Net
                </div>
                <div className="text-2xl font-extrabold text-indigo-600">
                  {submittedStats.netScore}
                </div>
              </div>
              <div className="col-span-2 rounded-xl bg-amber-500/10 p-3 sm:col-span-1">
                <div className="text-[11px] text-amber-700 dark:text-amber-300">
                  Puan
                </div>
                <div className="text-2xl font-extrabold text-amber-600">
                  {submittedStats.estimatedPoints}
                </div>
              </div>
            </div>

            <div className="mt-5 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left dark:border-slate-800 dark:bg-slate-800/40">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                Konu Bazlı Başarı Oranı
              </h4>
              <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                {topicRows.map(([topicName, stat]) => {
                  const pct = Math.round((stat.correct / stat.total) * 100);
                  return (
                    <div
                      key={topicName}
                      className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs dark:bg-slate-900"
                    >
                      <span className="truncate pr-2 text-slate-700 dark:text-slate-200">
                        {topicName}
                      </span>
                      <span
                        className={`shrink-0 font-bold ${
                          pct === 100
                            ? "text-emerald-600"
                            : pct >= 50
                              ? "text-amber-600"
                              : "text-rose-600"
                        }`}
                      >
                        %{pct} ({stat.correct}/{stat.total})
                      </span>
                    </div>
                  );
                })}
              </div>
              {weakRows.length > 0 && (
                <p className="mt-3 text-[11px] text-amber-700 dark:text-amber-300">
                  Yanlış yaptığın konular otomatik olarak{" "}
                  <strong>Yanlış Defterine</strong> (1-3-7-14 gün tekrar
                  programıyla) eklendi.
                </p>
              )}
            </div>

            <div className="mt-4 w-full rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-2.5 text-xs text-indigo-800 dark:text-indigo-200">
              Gerçek AÖF çıkmış sorularını da çözmek sınav formatına alışmak
              için en güvenilir yoldur.
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setExamQuestions(null);
                  setSubmittedStats(null);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <RotateCcw className="h-4 w-4" />
                Yeni Deneme Oluştur
              </button>
              <button
                type="button"
                onClick={() => setActiveView("dashboard")}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Panel & Yanlış Defterine Dön
              </button>
            </div>
          </div>
        </div>

        <AnswerKeySection
          questions={examQuestions}
          answers={answers}
          title="Deneme Sınavı Cevap Anahtarı ve Gerekçeler"
        />
      </div>
    );
  }

  // Aktif Deneme Sınavı Çözüm Ekranı (Tüm sorular sırayla, cevaplar en sonda!)
  if (examQuestions && selectedCourse) {
    const answeredCount = Object.values(answers).filter(
      (v) => v && v !== "BOS"
    ).length;

    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="sticky top-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {selectedCourse.name} • AÖF Deneme Sınavı
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {answeredCount} / {examQuestions.length} soru işaretlendi
              {examAiMeta ? ` • ${examAiMeta.model}` : ""}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-3 py-1.5 font-mono text-xs font-bold text-amber-700 dark:text-amber-300">
              <Clock className="h-3.5 w-3.5" />
              {formatTimer(remainingSeconds)}
            </span>
            <button
              type="button"
              onClick={handleSubmitExam}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              Sınavı Bitir ve Cevapları Gör
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {examQuestions.map((q, idx) => {
            const picked = answers[q.id];
            const showFeedbackNow =
              revealMode === "immediate" && Boolean(picked);
            const correctOpt = q.options.find((o) => o.key === q.correctKey);

            return (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="rounded-lg bg-indigo-600 px-2.5 py-0.5 font-bold text-white">
                    Soru {idx + 1}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {q.unitNumber ? `Ünite ${q.unitNumber}` : ""}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-900 dark:text-white">
                  {q.question}
                </p>
                {q.codeSnippet && (
                  <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-3.5 text-xs text-slate-100">
                    <code>{q.codeSnippet}</code>
                  </pre>
                )}
                <div className="mt-4 space-y-2">
                  {q.options.map((opt) => {
                    const isSelected = picked === opt.key;
                    const isCorrectOption = opt.key === q.correctKey;

                    let cardCls = isSelected
                      ? "border-indigo-600 bg-indigo-500/10 text-slate-900 dark:text-white"
                      : "border-slate-200 bg-slate-50/70 text-slate-700 hover:border-indigo-400 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-200";

                    if (showFeedbackNow) {
                      if (isCorrectOption) {
                        cardCls =
                          "border-emerald-500 bg-emerald-500/10 text-slate-900 dark:text-white";
                      } else if (isSelected && !isCorrectOption) {
                        cardCls =
                          "border-rose-500 bg-rose-500/10 text-slate-900 dark:text-white";
                      } else {
                        cardCls =
                          "border-slate-200/70 bg-slate-50/40 text-slate-500 opacity-85 dark:border-slate-800/70 dark:bg-slate-950/20 dark:text-slate-400";
                      }
                    }

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        disabled={showFeedbackNow}
                        onClick={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [q.id]:
                              revealMode === "end" && isSelected
                                ? "BOS"
                                : opt.key,
                          }))
                        }
                        className={`w-full rounded-xl border p-3 text-left text-xs transition ${cardCls}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-bold ${
                                showFeedbackNow && isCorrectOption
                                  ? "bg-emerald-600 text-white"
                                  : showFeedbackNow &&
                                      isSelected &&
                                      !isCorrectOption
                                    ? "bg-rose-600 text-white"
                                    : isSelected
                                      ? "bg-indigo-600 text-white"
                                      : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span className="pt-0.5">{opt.text}</span>
                          </div>
                          {showFeedbackNow && isCorrectOption && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          )}
                          {showFeedbackNow &&
                            isSelected &&
                            !isCorrectOption && (
                              <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
                            )}
                        </div>
                        {showFeedbackNow && (
                          <div className="mt-2 border-t border-slate-200/70 pt-1.5 text-[11px] leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300">
                            <strong>
                              {isCorrectOption
                                ? "Neden Doğru:"
                                : "Neden Yanlış:"}
                            </strong>{" "}
                            {opt.explanation}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {showFeedbackNow && correctOpt && (
                  <div
                    className={`mt-3 rounded-xl border p-3 text-xs ${
                      picked === q.correctKey
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                        : "border-rose-500/40 bg-rose-500/10 text-rose-900 dark:text-rose-200"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 font-bold">
                      <span>
                        {picked === q.correctKey
                          ? `Doğru Cevap: ${q.correctKey} Şıkkı`
                          : `Yanlış (${picked}) — Doğru Cevap: ${q.correctKey} Şıkkı`}
                      </span>
                      {q.guideReference && (
                        <span className="text-[11px] font-semibold opacity-80">
                          Dayanak: {q.guideReference}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 leading-relaxed">
                      <strong>Açıklama:</strong> {correctOpt.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pb-6">
          <button
            type="button"
            onClick={handleSubmitExam}
            className="rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-500"
          >
            Sınavı Bitir ve Sonuçları Hesapla
          </button>
        </div>
      </div>
    );
  }

  // Deneme Sınavı Kurulum Ekranı
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
          <FileCheck2 className="h-3.5 w-3.5" />
          Çoklu Ünite Deneme Sınavı Modu
        </div>
        <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
          Gerçek AÖF Sınav Simülasyonu Oluştur
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Birden fazla üniteyi seçerek süreli ve cevapları en sonda açıklanan
          karma AÖF deneme sınavı başlat.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              1. Ders Seçin
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {state.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              2. Soru Sayısı
            </label>
            <div className="inline-flex w-full rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
              {([10, 15, 20] as const).map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                    questionCount === cnt
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {cnt} Soru
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Cevap Gösterim Şekli
          </label>
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setRevealMode("immediate")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                revealMode === "immediate"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              Anında Cevap & Açıklama
            </button>
            <button
              type="button"
              onClick={() => setRevealMode("end")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                revealMode === "end"
                  ? "bg-slate-700 text-white shadow-xs dark:bg-slate-600"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              Cevaplar Sonda
            </button>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              3. Sınava Dahil Üniteler (Yalnızca metin yüklenmiş üniteler seçilebilir)
            </label>
            {availableUnits.length > 0 && unitCfg && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset("vize")}
                  className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
                >
                  Vize ({unitCfg.vizeLabel})
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("final")}
                  className="rounded-lg bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-500/20 dark:text-indigo-300"
                >
                  Final ({unitCfg.finalLabel})
                </button>
                {unitCfg.finalUnits.length < unitCfg.totalUnits && (
                  <button
                    type="button"
                    onClick={() => applyPreset("all")}
                    className="rounded-lg bg-slate-500/10 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-500/20 dark:text-slate-300"
                  >
                    Tümü
                  </button>
                )}
              </div>
            )}
          </div>

          {availableUnits.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Bu ders için henüz ünite metni veya PDF yüklenmemiş. Önce sol
              menüden derse girip en az 1 ünite içeriği ekleyin.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
              {(unitCfg?.unitNumbers ?? []).map((u) => {
                const enabled = availableUnits.includes(u);
                const checked = selectedUnits.includes(u);
                return (
                  <button
                    key={u}
                    type="button"
                    disabled={!enabled}
                    onClick={() => toggleUnit(u)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                      !enabled
                        ? "cursor-not-allowed border-slate-200/50 bg-slate-100/50 text-slate-400 opacity-50 dark:border-slate-800 dark:bg-slate-900"
                        : checked
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="h-3.5 w-3.5" />
                    ) : (
                      <Square className="h-3.5 w-3.5" />
                    )}
                    Ü{u}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            disabled={isLoading || selectedUnits.length === 0}
            onClick={() => void handleStartExam()}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {questionCount} Soruluk Deneme Hazırlanıyor...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Deneme Sınavını Başlat ({questionCount} Soru)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
