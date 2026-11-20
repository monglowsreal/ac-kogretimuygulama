"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Code2,
  GraduationCap,
  LayoutDashboard,
  Moon,
  Plus,
  Sparkles,
  Sun,
  X,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  FileCheck2,
  Trash2,
} from "lucide-react";
import {
  CourseUnitDraft,
  CourseUnitScopeFields,
  createDefaultUnitDraft,
} from "@/components/CourseUnitConfigModal";
import { useCoach } from "@/context/CoachContext";
import { EVREN_CHAT_MODELS } from "@/data/evren-models";
import { classifyCourseCategory } from "@/lib/classifier";
import { isLocalLoopbackHost } from "@/lib/storage";
import {
  AiHealthStatus,
  AiProviderPreference,
  CourseCategory,
} from "@/types/coach";

interface SidebarProps {
  aiStatus: AiHealthStatus | null;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenApiSettings?: () => void;
}

export function Sidebar({
  aiStatus,
  mobileOpen,
  onCloseMobile,
  onOpenApiSettings,
}: SidebarProps) {
  const {
    hydrated,
    state,
    theme,
    toggleTheme,
    aiPreference,
    setAiPreference,
    evrenModelPreference,
    setEvrenModelPreference,
    activeView,
    setActiveView,
    selectedCourseId,
    selectCourse,
    addCourse,
    deleteCourse,
    getCourseProgress,
  } = useCoach();

  const apiConfigured = aiStatus ? aiStatus.configured : null;

  const isDesktopApp =
    hydrated && typeof window !== "undefined" && Boolean(window.electronDesktop?.isDesktop);
  const canConfigureApiLocally =
    hydrated && (isDesktopApp || isLocalLoopbackHost());

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseCode, setNewCourseCode] = useState("");
  const [manualCategory, setManualCategory] = useState<CourseCategory | "auto">(
    "auto"
  );
  const [unitDraft, setUnitDraft] = useState<CourseUnitDraft>(() =>
    createDefaultUnitDraft()
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isAddFormVisible = showAddModal || (hydrated && state.courses.length === 0);

  const sozelCourses = state.courses.filter((c) => c.category === "sozel");
  const teknikCourses = state.courses.filter((c) => c.category === "teknik");

  const detectedPreview = newCourseName.trim()
    ? classifyCourseCategory(newCourseName)
    : "sozel";

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;
    const finalCategory =
      manualCategory === "auto" ? undefined : manualCategory;
    const created = addCourse(
      newCourseName,
      finalCategory,
      undefined,
      newCourseCode,
      unitDraft
    );
    setNewCourseName("");
    setNewCourseCode("");
    setManualCategory("auto");
    setUnitDraft(createDefaultUnitDraft());
    setShowAddModal(false);
    selectCourse(created.id, 1, "upload");
    onCloseMobile();
  };

  const openReviewsCount = state.reviewItems.filter((r) => !r.resolved).length;

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900">
      {/* Marka Başlığı */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-500/30">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              AÖF Akıllı Koç
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kişisel Çalışma Koçu
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Menüyü kapat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Ana Navigasyon */}
      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        <button
          type="button"
          onClick={() => {
            setActiveView("dashboard");
            onCloseMobile();
          }}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
            activeView === "dashboard"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
              : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/70"
          }`}
        >
          <span className="flex items-center gap-2.5">
            <LayoutDashboard className="h-4 w-4" />
            İlerleme & Sınav Paneli
          </span>
          {openReviewsCount > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                activeView === "dashboard"
                  ? "bg-white/20 text-white"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              }`}
            >
              {openReviewsCount} tekrar
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveView("exam");
            onCloseMobile();
          }}
          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
            activeView === "exam"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
              : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/70"
          }`}
        >
          <FileCheck2 className="h-4 w-4" />
          Deneme Sınavı Modu
        </button>

        {/* Dersler & Yeni Ders Ekle (Üstte Herkes İçin Erişilebilir) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
              Derslerim ({state.courses.length})
            </span>
            {!isAddFormVisible && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2 py-1 text-[11px] font-semibold text-indigo-600 transition hover:bg-indigo-500/20 dark:text-indigo-300"
              >
                <Plus className="h-3.5 w-3.5" />
                Ders Ekle
              </button>
            )}
          </div>

          {isAddFormVisible && (
            <form
              onSubmit={handleAddCourse}
              className="space-y-2 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-3 dark:bg-indigo-500/10"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Yeni Ders Ekle
                </span>
                {state.courses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <input
                type="text"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="Ders adı yaz (örn: Genel İşletme)"
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
              <input
                type="text"
                value={newCourseCode}
                onChange={(e) => setNewCourseCode(e.target.value)}
                placeholder="Ders kodu (opsiyonel, örn: İŞL101)"
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
              <div className="space-y-1">
                <label className="block text-[11px] text-slate-500 dark:text-slate-400">
                  Kategori (Otomatik:{" "}
                  <span className="font-medium text-indigo-500">
                    {detectedPreview === "teknik" ? "Teknik" : "Sözel"}
                  </span>
                  )
                </label>
                <select
                  value={manualCategory}
                  onChange={(e) =>
                    setManualCategory(e.target.value as CourseCategory | "auto")
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="auto">Otomatik Algıla</option>
                  <option value="sozel">Sözel / Kavramsal</option>
                  <option value="teknik">Teknik / Kodlama</option>
                </select>
              </div>
              <CourseUnitScopeFields
                value={unitDraft}
                onChange={setUnitDraft}
                compact
              />
              <button
                type="submit"
                disabled={!newCourseName.trim()}
                className="w-full rounded-lg bg-indigo-600 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
              >
                Dersi Ekle ve Ünite Yükle
              </button>
            </form>
          )}
        </div>

        {hydrated && state.courses.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 px-3 py-3 text-[11px] leading-relaxed text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Yukarıdan dersini yazıp ekleyerek hemen kendi ünitelerini ve
            PDF&apos;lerini yükleyebilirsin.
          </div>
        )}

        {/* Sözel / Kavramsal Dersler */}
        {sozelCourses.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-1.5 px-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
              <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
              Sözel / Kavramsal Dersler
            </div>
            <div className="space-y-1">
              {sozelCourses.map((course) => {
                const progress = getCourseProgress(course.id);
                const isSelected =
                  activeView === "course" && selectedCourseId === course.id;
                const isConfirming = confirmDeleteId === course.id;
                return (
                  <div
                    key={course.id}
                    className={`group flex items-center justify-between gap-1 rounded-xl px-2 py-1.5 text-sm transition-all ${
                      isSelected
                        ? "bg-emerald-500/10 font-semibold text-emerald-700 ring-1 ring-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDeleteId(null);
                        selectCourse(course.id);
                        onCloseMobile();
                      }}
                      className="flex min-w-0 flex-1 items-center justify-between px-1 py-1 text-left"
                    >
                      <span className="truncate pr-2">{course.name}</span>
                      <span
                        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                          isSelected
                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {progress.vizeTotal > 0
                          ? `${progress.vizeCompleted}/${progress.vizeTotal} V`
                          : `${progress.finalCompleted}/${progress.finalTotal} F`}
                      </span>
                    </button>
                    {isConfirming ? (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            deleteCourse(course.id);
                            setConfirmDeleteId(null);
                          }}
                          className="rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-rose-500"
                        >
                          Sil
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                        >
                          İptal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        title="Dersi sil"
                        onClick={() => setConfirmDeleteId(course.id)}
                        className="shrink-0 rounded-md p-1 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-500 focus:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Teknik / Kodlama Dersleri */}
        {teknikCourses.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-1.5 px-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
              <Code2 className="h-3.5 w-3.5 text-sky-500" />
              Teknik / Kodlama Dersleri
            </div>
            <div className="space-y-1">
              {teknikCourses.map((course) => {
                const progress = getCourseProgress(course.id);
                const isSelected =
                  activeView === "course" && selectedCourseId === course.id;
                const isConfirming = confirmDeleteId === course.id;
                return (
                  <div
                    key={course.id}
                    className={`group flex items-center justify-between gap-1 rounded-xl px-2 py-1.5 text-sm transition-all ${
                      isSelected
                        ? "bg-sky-500/10 font-semibold text-sky-700 ring-1 ring-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDeleteId(null);
                        selectCourse(course.id);
                        onCloseMobile();
                      }}
                      className="flex min-w-0 flex-1 items-center justify-between px-1 py-1 text-left"
                    >
                      <span className="truncate pr-2">{course.name}</span>
                      <span
                        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                          isSelected
                            ? "bg-sky-500/20 text-sky-700 dark:text-sky-300"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {progress.vizeTotal > 0
                          ? `${progress.vizeCompleted}/${progress.vizeTotal} V`
                          : `${progress.finalCompleted}/${progress.finalTotal} F`}
                      </span>
                    </button>
                    {isConfirming ? (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            deleteCourse(course.id);
                            setConfirmDeleteId(null);
                          }}
                          className="rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-rose-500"
                        >
                          Sil
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                        >
                          İptal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        title="Dersi sil"
                        onClick={() => setConfirmDeleteId(course.id)}
                        className="shrink-0 rounded-md p-1 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-500 focus:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Alt Araç Çubuğu: API Durumu ve Tema Değiştirici */}
      <div className="space-y-2.5 border-t border-slate-200 p-3 dark:border-slate-800/80">
        <div
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${
            apiConfigured === true
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : apiConfigured === false
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          }`}
        >
          {apiConfigured === true ? (
            <>
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="truncate font-medium">
                {(() => {
                  const avail = aiStatus?.availableProviders ?? [];
                  if (avail.length > 1) {
                    const selected =
                      avail.find((p) => p.id === aiPreference) ?? avail[0];
                    return `${selected.label.split(" ")[0]} + ${avail.length - 1} Yedek Hazır`;
                  }
                  if (avail.length === 1) {
                    return `${avail[0].label.split(" ")[0]} (${avail[0].model}) Hazır`;
                  }
                  return `${aiStatus?.model || "AI"} Hazır`;
                })()}
              </span>
            </>
          ) : apiConfigured === false ? (
            <>
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="truncate font-medium">API Anahtarı Gerekli</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 shrink-0 animate-pulse" />
              <span>AI Durumu Kontrol Ediliyor</span>
            </>
          )}
        </div>

        {(aiStatus?.availableProviders?.length ?? 0) > 1 && (
          <div className="space-y-1.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                AI Motoru
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                {aiPreference === "auto"
                  ? "Otomatik Yedek"
                  : `${aiPreference.toUpperCase()} Aktif`}
              </span>
            </div>
            <select
              value={aiPreference}
              onChange={(e) =>
                setAiPreference(e.target.value as AiProviderPreference)
              }
              aria-label="AI Motoru Seçimi"
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="auto">Otomatik (Öncelikli → Yedek)</option>
              {(aiStatus?.availableProviders ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} ({p.model})
                </option>
              ))}
            </select>
            {aiPreference === "evren" && (
              <select
                value={evrenModelPreference || aiStatus?.evrenModel}
                onChange={(e) => setEvrenModelPreference(e.target.value)}
                aria-label="EVREN Model Seçimi"
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {EVREN_CHAT_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {hydrated && onOpenApiSettings && (
          <button
            type="button"
            onClick={onOpenApiSettings}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <span className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-indigo-500" />
              API &amp; AI Ayarları
            </span>
            <span className="rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-300">
              {canConfigureApiLocally
                ? isDesktopApp
                  ? "Masaüstü"
                  : "Yerel"
                : "Tarayıcı"}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <span className="flex items-center gap-2">
            {theme === "dark" ? (
              <Moon className="h-4 w-4 text-indigo-400" />
            ) : (
              <Sun className="h-4 w-4 text-amber-500" />
            )}
            {theme === "dark" ? "Koyu Tema" : "Açık Tema"}
          </span>
          <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            Değiştir
          </span>
        </button>

        <p className="px-1 pt-1 text-[10px] leading-snug text-slate-400 dark:text-slate-500">
          Bağımsız eğitim aracıdır; Anadolu Üniversitesi veya AÖF ile resmi bağı
          yoktur.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Masaüstü Sabit Yan Menü */}
      <aside className="hidden w-72 shrink-0 lg:block">{sidebarContent}</aside>

      {/* Mobil Çekmece Yan Menü */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 w-72 max-w-[85vw]">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
