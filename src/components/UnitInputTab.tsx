"use client";

import React, { useRef, useState } from "react";
import {
  FileText,
  Upload,
  Sparkles,
  HelpCircle,
  Trash2,
  Loader2,
  BookMarked,
  AlertCircle,
} from "lucide-react";
import { SAMPLE_UNIT_TEXTS } from "@/data/samples";
import { useCoach } from "@/context/CoachContext";

interface UnitInputTabProps {
  onGenerateGuide: () => Promise<void>;
  isGeneratingGuide: boolean;
  guideError: string | null;
}

export function UnitInputTab({
  onGenerateGuide,
  isGeneratingGuide,
  guideError,
}: UnitInputTabProps) {
  const {
    selectedCourse,
    selectedUnitNumber,
    currentUnitRecord,
    updateUnitText,
    updateUnitContentMode,
    setActiveSubTab,
  } = useCoach();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileWarning, setFileWarning] = useState<string | null>(null);

  if (!selectedCourse) return null;

  const handleFile = async (file: File) => {
    setFileError(null);
    setFileWarning(null);
    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith(".txt")) {
      setIsParsingFile(true);
      try {
        const text = await file.text();
        updateUnitText(selectedCourse.id, selectedUnitNumber, text, file.name);
      } catch {
        setFileError("Metin dosyası okunurken bir hata oluştu.");
      } finally {
        setIsParsingFile(false);
      }
      return;
    }

    if (lowerName.endsWith(".pdf")) {
      setIsParsingFile(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/extract-pdf", {
          method: "POST",
          body: formData,
        });
        const data = (await res.json()) as {
          text?: string;
          totalPages?: number;
          warning?: string;
          error?: string;
        };

        if (!res.ok || !data.text) {
          throw new Error(
            data.error || "PDF içeriğinden metin çıkarılamadı."
          );
        }

        if (data.warning) {
          setFileWarning(data.warning);
        }

        updateUnitText(
          selectedCourse.id,
          selectedUnitNumber,
          data.text,
          file.name,
          data.totalPages
        );
      } catch (err) {
        setFileError(
          err instanceof Error
            ? err.message
            : "PDF işlenirken beklenmeyen bir hata oluştu."
        );
      } finally {
        setIsParsingFile(false);
      }
      return;
    }

    setFileError("Lütfen yalnızca .txt veya .pdf uzantılı bir dosya yükleyin.");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const handleLoadSample = () => {
    const sample = SAMPLE_UNIT_TEXTS[selectedCourse.id];
    const text = sample
      ? sample.content
      : `${selectedCourse.name.toUpperCase()} - ÜNİTE ${selectedUnitNumber} ÖRNEK DERS NOTU\n\nBu alana AÖF kitabından veya ders notlarından özetini yapıştırabilirsin. Yapay zeka koçu kritik kavramları, çalışma stratejisini ve çeldiricili test sorularını üretecektir.`;
    updateUnitText(
      selectedCourse.id,
      selectedUnitNumber,
      text,
      sample ? `${sample.title}.txt` : `ornek-unite-${selectedUnitNumber}.txt`
    );
    setFileError(null);
  };

  const charCount = currentUnitRecord.rawText.trim().length;
  const canAnalyze = charCount >= 50;
  const contentMode = currentUnitRecord.contentMode ?? "auto";
  const effectiveIsFullUnit =
    contentMode === "full_unit" ||
    (contentMode === "auto" && charCount >= 6000);

  return (
    <div className="space-y-4">
      {/* Dosya Yükleme Kartı */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
          isDragging
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-slate-300 bg-white hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500/70"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          {isParsingFile ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Upload className="h-6 w-6" />
          )}
        </div>

        <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
          {isParsingFile
            ? "Dosya metne dönüştürülüyor..."
            : "Ünite Özeti veya Tam Ünite PDF'i Yükle (.pdf / .txt)"}
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Özeti olmayan derslerde doğrudan kitabın tam ünite PDF&apos;ini
          (250 MB&apos;a kadar) veya metnini (300.000 karaktere kadar)
          yükleyebilirsin.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            disabled={isParsingFile}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            <FileText className="h-3.5 w-3.5" />
            Dosya Seç (.pdf / .txt)
          </button>

          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <BookMarked className="h-3.5 w-3.5 text-indigo-500" />
            Örnek Ünite Metni Doldur
          </button>
        </div>

        {currentUnitRecord.fileName && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
            <FileText className="h-3 w-3" />
            Yüklü kaynak: {currentUnitRecord.fileName}
            {currentUnitRecord.totalPages
              ? ` • ${currentUnitRecord.totalPages} sayfa`
              : ""}
          </p>
        )}

        {fileError && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {fileError}
          </p>
        )}

        {fileWarning && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {fileWarning}
          </p>
        )}
      </div>

      {/* Ünite Metni Düzenleme Kartı */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Ünite {selectedUnitNumber} İçeriği (Tam Ünite veya Özet)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tam ders ünitesi yapıştırdığında yapay zeka tüm alt başlıkları
              tarayarak kapsamlı rehber ve dengeli sorular hazırlar.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* İçerik Modu Seçimi */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px] dark:border-slate-700 dark:bg-slate-800">
              {(
                [
                  { id: "auto", label: "Otomatik" },
                  { id: "full_unit", label: "Tam Ünite" },
                  { id: "summary", label: "Özet" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    updateUnitContentMode(
                      selectedCourse.id,
                      selectedUnitNumber,
                      opt.id
                    )
                  }
                  className={`rounded-md px-2 py-1 font-medium transition ${
                    contentMode === opt.id
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <span
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                effectiveIsFullUnit
                  ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {effectiveIsFullUnit ? "Tam Ünite Modu" : "Özet Modu"}
            </span>

            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {charCount.toLocaleString("tr-TR")} karakter
            </span>
            {charCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  updateUnitText(selectedCourse.id, selectedUnitNumber, "", "", 0)
                }
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Temizle
              </button>
            )}
          </div>
        </div>

        <textarea
          rows={11}
          value={currentUnitRecord.rawText}
          onChange={(e) =>
            updateUnitText(
              selectedCourse.id,
              selectedUnitNumber,
              e.target.value
            )
          }
          placeholder={`${selectedCourse.name} - Ünite ${selectedUnitNumber} tam ünite metnini veya özetini buraya yapıştır...`}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100 dark:focus:bg-slate-950"
        />

        {charCount > 300000 && (
          <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">
            Not: Metin 300.000 karakterden uzun olduğu için analizde ilk 300.000
            karakter işlenecektir.
          </p>
        )}

        {guideError && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{guideError}</span>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {canAnalyze
              ? selectedCourse.category === "teknik"
                ? "Teknik analiz modu aktif: Kod/formül mantığı + pratik görevler üretilecek."
                : "Sözel analiz modu aktif: Anahtar kavramlar + ezber ipuçları üretilecek."
              : "Analiz için en az 50 karakterlik ünite metni girmelisin."}
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={!canAnalyze}
              onClick={() => setActiveSubTab("quiz")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <HelpCircle className="h-4 w-4 text-sky-500" />
              Mini Quiz Sekmesine Geç
            </button>

            <button
              type="button"
              disabled={!canAnalyze || isGeneratingGuide}
              onClick={() => void onGenerateGuide()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGeneratingGuide ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Koç Rehberi Hazırlanıyor...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {currentUnitRecord.guide
                    ? "Çalışma Rehberini Yenile"
                    : "Çalışma Rehberi Oluştur (AI)"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
