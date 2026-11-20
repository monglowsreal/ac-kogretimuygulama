"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Brain,
  CheckCircle2,
  Circle,
  Code2,
  FileText,
  HelpCircle,
  Printer,
} from "lucide-react";
import { A4PrintModal } from "@/components/A4PrintModal";
import { TOTAL_UNITS, VIZE_UNIT_LIMIT } from "@/data/courses";
import { useCoach } from "@/context/CoachContext";
import { QuizTab } from "@/components/QuizTab";
import { StudyGuideTab } from "@/components/StudyGuideTab";
import { UnitInputTab } from "@/components/UnitInputTab";
import { StudyGuide } from "@/types/coach";

export function UnitWorkspace() {
  const {
    selectedCourse,
    selectedUnitNumber,
    selectUnit,
    activeSubTab,
    setActiveSubTab,
    currentUnitRecord,
    getUnitRecord,
    getCourseProgress,
    toggleUnitCompleted,
    saveStudyGuide,
    setActiveView,
    aiPreference,
    evrenModelPreference,
    clientAiOverride,
  } = useCoach();

  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [guideError, setGuideError] = useState<string | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  if (!selectedCourse) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-xs dark:border-slate-700 dark:bg-slate-900">
        <BookOpen className="mx-auto h-10 w-10 text-indigo-500" />
        <h2 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
          Henüz Bir Ders Eklenmedi
        </h2>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          Sol panelden ders adını yazıp ekledikten sonra 1–8. ünite içeriklerini
          yükleyebilir, A4 çıktı ve 5 şıklı quiz oluşturabilirsin.
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

  const progress = getCourseProgress(selectedCourse.id);
  const isTech = selectedCourse.category === "teknik";
  const isVizeUnit = selectedUnitNumber <= VIZE_UNIT_LIMIT;
  const hasAnyCourseContent = Array.from(
    { length: TOTAL_UNITS },
    (_, i) => i + 1
  ).some((u) => {
    const rec = getUnitRecord(selectedCourse.id, u);
    return Boolean(rec.guide || rec.rawText.trim().length >= 50);
  });

  const handleGenerateGuide = async () => {
    if (currentUnitRecord.rawText.trim().length < 50) return;
    setIsGeneratingGuide(true);
    setGuideError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName: selectedCourse.name,
          category: selectedCourse.category,
          unitNumber: selectedUnitNumber,
          unitText: currentUnitRecord.rawText,
          contentMode: currentUnitRecord.contentMode ?? "auto",
          preferredProvider: aiPreference,
          evrenModel: evrenModelPreference || undefined,
          clientAiConfig: clientAiOverride,
        }),
      });

      const data = (await res.json()) as {
        guide?: StudyGuide;
        error?: string;
      };

      if (!res.ok || !data.guide) {
        throw new Error(data.error || "Çalışma rehberi oluşturulamadı.");
      }

      saveStudyGuide(selectedCourse.id, selectedUnitNumber, data.guide);
      setActiveSubTab("guide");
    } catch (err) {
      setGuideError(
        err instanceof Error
          ? err.message
          : "Analiz sırasında beklenmeyen bir hata oluştu."
      );
    } finally {
      setIsGeneratingGuide(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Ders Üst Bilgi Kartı */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  isTech
                    ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {isTech ? (
                  <Code2 className="h-3.5 w-3.5" />
                ) : (
                  <BookOpen className="h-3.5 w-3.5" />
                )}
                {isTech ? "Teknik / Kodlama Dersi" : "Sözel / Kavramsal Ders"}
              </span>
              <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {selectedCourse.code}
              </span>
              <span
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  isVizeUnit
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                }`}
              >
                {isVizeUnit
                  ? "Vize + Final Kapsamında"
                  : "Final Kapsamında (5–8)"}
              </span>
            </div>

            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {selectedCourse.name} — Ünite {selectedUnitNumber}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {selectedCourse.description}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>
                Vize:{" "}
                <strong className="text-amber-600 dark:text-amber-400">
                  %{progress.vizePercent}
                </strong>
              </span>
              <span>•</span>
              <span>
                Final:{" "}
                <strong className="text-indigo-600 dark:text-indigo-400">
                  %{progress.finalPercent}
                </strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!hasAnyCourseContent}
                onClick={() => setPrintModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-40 dark:text-indigo-300"
              >
                <Printer className="h-4 w-4" />
                A4 Not Çıktısı
              </button>

              <button
                type="button"
                onClick={() =>
                  toggleUnitCompleted(selectedCourse.id, selectedUnitNumber)
                }
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                currentUnitRecord.completed
                  ? "bg-emerald-600 text-white hover:bg-emerald-500"
                  : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              }`}
            >
              {currentUnitRecord.completed ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Ünite Tamamlandı
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4" />
                  Tamamlandı İşaretle
                </>
              )}
              </button>
            </div>
          </div>
        </div>

        {/* 1-8 Ünite Seçim Şeridi */}
        <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {Array.from({ length: TOTAL_UNITS }, (_, i) => i + 1).map(
              (unitNum) => {
                const rec = getUnitRecord(selectedCourse.id, unitNum);
                const isSelected = selectedUnitNumber === unitNum;
                const isVize = unitNum <= VIZE_UNIT_LIMIT;

                return (
                  <button
                    key={unitNum}
                    type="button"
                    onClick={() => {
                      selectUnit(unitNum);
                      setGuideError(null);
                    }}
                    className={`flex flex-col items-center rounded-xl border px-2 py-2 text-xs transition ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                        : rec.completed
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="font-bold">Ünite {unitNum}</span>
                    <span
                      className={`mt-0.5 text-[10px] ${
                        isSelected
                          ? "text-indigo-100"
                          : isVize
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-slate-400"
                      }`}
                    >
                      {rec.guide
                        ? "Rehber Hazır"
                        : isVize
                          ? "Vize"
                          : "Final"}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* 3 Modül Sekme Çubuğu */}
      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setActiveSubTab("upload")}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
            activeSubTab === "upload"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span className="truncate">1. Ünite İçeriği</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("guide")}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
            activeSubTab === "guide"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <Brain className="h-4 w-4" />
          <span className="truncate">2. Çalışma Rehberi</span>
          {currentUnitRecord.guide && activeSubTab !== "guide" && (
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("quiz")}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
            activeSubTab === "quiz"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          <span className="truncate">3. AÖF Mini Quiz</span>
          {currentUnitRecord.quizHistory.length > 0 &&
            activeSubTab !== "quiz" && (
              <span className="rounded-full bg-sky-500/20 px-1.5 text-[10px] text-sky-600 dark:text-sky-300">
                {currentUnitRecord.quizHistory.length}
              </span>
            )}
        </button>
      </div>

      {/* Aktif Sekme İçeriği */}
      {activeSubTab === "upload" && (
        <UnitInputTab
          onGenerateGuide={handleGenerateGuide}
          isGeneratingGuide={isGeneratingGuide}
          guideError={guideError}
        />
      )}
      {activeSubTab === "guide" && (
        <StudyGuideTab
          onGenerateGuide={handleGenerateGuide}
          isGeneratingGuide={isGeneratingGuide}
          guideError={guideError}
          onOpenPrint={() => setPrintModalOpen(true)}
        />
      )}
      {activeSubTab === "quiz" && <QuizTab />}

      <A4PrintModal
        key={`${selectedCourse.id}-${selectedUnitNumber}-${printModalOpen ? "open" : "closed"}`}
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        course={selectedCourse}
        initialUnitNumber={selectedUnitNumber}
      />
    </div>
  );
}
