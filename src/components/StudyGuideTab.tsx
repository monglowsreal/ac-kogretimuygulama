"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Brain,
  CheckCircle2,
  Code2,
  Compass,
  Lightbulb,
  Loader2,
  MessageSquareCheck,
  Play,
  Printer,
  RefreshCw,
  Sparkles,
  Terminal,
  AlertTriangle,
  ArrowRight,
  ListChecks,
  ShieldCheck,
  Table2,
} from "lucide-react";
import { useCoach } from "@/context/CoachContext";
import {
  ComprehensionFeedbackItem,
  ComprehensionPromptItem,
} from "@/types/coach";

interface StudyGuideTabProps {
  onGenerateGuide: () => Promise<void>;
  isGeneratingGuide: boolean;
  guideError: string | null;
  onOpenPrint?: () => void;
}

export function StudyGuideTab({
  onGenerateGuide,
  isGeneratingGuide,
  guideError,
  onOpenPrint,
}: StudyGuideTabProps) {
  const {
    selectedCourse,
    selectedUnitNumber,
    currentUnitRecord,
    setActiveSubTab,
    aiPreference,
    evrenModelPreference,
    clientAiOverride,
  } = useCoach();
  const guide = currentUnitRecord.guide;
  const hasRawText = currentUnitRecord.rawText.trim().length >= 50;
  const unitKey = `${selectedCourse?.id ?? "none"}::${selectedUnitNumber}`;

  const [compByUnit, setCompByUnit] = useState<
    Record<
      string,
      {
        open: boolean;
        loading: boolean;
        error: string | null;
        prompts: ComprehensionPromptItem[];
        answers: Record<string, string>;
        feedback: ComprehensionFeedbackItem[] | null;
      }
    >
  >({});

  if (!selectedCourse) return null;

  const compState = compByUnit[unitKey] ?? {
    open: false,
    loading: false,
    error: null,
    prompts: [],
    answers: {},
    feedback: null,
  };

  const patchCompState = (
    updater: (prev: typeof compState) => typeof compState
  ) => {
    setCompByUnit((prev) => {
      const cur = prev[unitKey] ?? {
        open: false,
        loading: false,
        error: null,
        prompts: [],
        answers: {},
        feedback: null,
      };
      return { ...prev, [unitKey]: updater(cur) };
    });
  };

  const generateSelfCheck = async () => {
    if (!hasRawText) return;
    patchCompState((s) => ({ ...s, loading: true, error: null, feedback: null }));
    try {
      const res = await fetch("/api/comprehension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generate",
          courseName: selectedCourse.name,
          unitNumber: selectedUnitNumber,
          unitText: currentUnitRecord.rawText,
          preferredProvider: aiPreference,
          evrenModel: evrenModelPreference || undefined,
          clientAiConfig: clientAiOverride,
        }),
      });
      const data = (await res.json()) as {
        questions?: ComprehensionPromptItem[];
        error?: string;
      };
      if (!res.ok || !data.questions?.length) {
        throw new Error(data.error || "Anlama kontrolü hazırlanamadı.");
      }
      patchCompState((s) => ({
        ...s,
        open: true,
        loading: false,
        prompts: data.questions!,
        answers: {},
      }));
    } catch (err) {
      patchCompState((s) => ({
        ...s,
        loading: false,
        error:
          err instanceof Error ? err.message : "Anlama soruları alınamadı.",
      }));
    }
  };

  const evaluateSelfCheck = async () => {
    if (compState.prompts.length === 0) return;
    patchCompState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch("/api/comprehension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "evaluate",
          courseName: selectedCourse.name,
          unitNumber: selectedUnitNumber,
          unitText: currentUnitRecord.rawText,
          questions: compState.prompts.map((p) => ({
            ...p,
            userAnswer: compState.answers[p.id] || "",
          })),
          preferredProvider: aiPreference,
          evrenModel: evrenModelPreference || undefined,
          clientAiConfig: clientAiOverride,
        }),
      });
      const data = (await res.json()) as {
        feedback?: ComprehensionFeedbackItem[];
        error?: string;
      };
      if (!res.ok || !data.feedback) {
        throw new Error(data.error || "Yanıtlar değerlendirilemedi.");
      }
      patchCompState((s) => ({
        ...s,
        loading: false,
        feedback: data.feedback!,
      }));
    } catch (err) {
      patchCompState((s) => ({
        ...s,
        loading: false,
        error:
          err instanceof Error
            ? err.message
            : "Değerlendirme sırasında hata oluştu.",
      }));
    }
  };

  if (!guide) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          {isGeneratingGuide ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : (
            <Brain className="h-7 w-7" />
          )}
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
          {isGeneratingGuide
            ? "Yapay Zeka Koçun Üniteyi Analiz Ediyor..."
            : "Bu Ünite İçin Henüz Çalışma Rehberi Oluşturulmadı"}
        </h3>
        <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {hasRawText
            ? `${selectedCourse.name} (${
                selectedCourse.category === "teknik" ? "Teknik" : "Sözel"
              } strateji) için kritik kavramları ve adım adım eylem planını hemen oluşturabilirsin.`
            : "Önce Ünite İçeriği sekmesinden ders özetini yapıştır veya .pdf / .txt dosyası yükle."}
        </p>

        {guideError && (
          <div className="mx-auto mt-4 max-w-lg rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
            {guideError}
          </div>
        )}

        <div className="mt-5 flex justify-center gap-3">
          {hasRawText ? (
            <button
              type="button"
              disabled={isGeneratingGuide}
              onClick={() => void onGenerateGuide()}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              Çalışma Rehberi Oluştur
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveSubTab("upload")}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Ünite İçeriği Ekle
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  const isTeknik =
    (guide.detectedCategory || selectedCourse.category) === "teknik";

  return (
    <div className="space-y-5">
      {/* Üst Özet Kartı */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                isTeknik
                  ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {isTeknik ? (
                <Code2 className="h-3.5 w-3.5" />
              ) : (
                <BookOpen className="h-3.5 w-3.5" />
              )}
              {isTeknik
                ? "Teknik / Kodlama Stratejisi"
                : "Sözel / Kavramsal Strateji"}
            </span>
            {guide.aiMeta && (
              <span
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium ${
                  guide.aiMeta.provider === "evren"
                    ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                {guide.aiMeta.provider === "evren"
                  ? `EVREN • ${guide.aiMeta.model}`
                  : guide.aiMeta.model}
                {guide.aiMeta.fallbackFrom === "gemini" ? " (Yedek)" : ""}
              </span>
            )}
            <span className="text-xs text-slate-400">
              {new Date(guide.generatedAt).toLocaleDateString("tr-TR")}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenPrint && (
              <button
                type="button"
                onClick={onOpenPrint}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-300"
              >
                <Printer className="h-3.5 w-3.5" />
                A4 Çıktısı / PDF
              </button>
            )}
            <button
              type="button"
              disabled={isGeneratingGuide || !hasRawText}
              onClick={() => void onGenerateGuide()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  isGeneratingGuide ? "animate-spin" : ""
                }`}
              />
              Yeniden Üret
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("quiz")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500"
            >
              Bu Üniteden Mini Quiz Çöz
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
          Ünite Özeti
        </h3>
        {guide.aiMeta?.fallbackFrom === "gemini" && (
          <div className="mt-2.5 rounded-xl border border-indigo-500/25 bg-indigo-500/10 px-3.5 py-2 text-xs text-indigo-800 dark:text-indigo-200">
            Gemini API ({guide.aiMeta.fallbackReason || "kota/limit"}) nedeniyle bu rehber otomatik olarak{" "}
            <strong>EVREN LLM ({guide.aiMeta.model})</strong> ile oluşturuldu.
          </div>
        )}
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {guide.unitSummary}
        </p>
      </div>

      {/* Bölüm Bölüm Çalışılacak Yerler & Sınav Notları */}
      {guide.sectionNotes && guide.sectionNotes.length > 0 ? (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-indigo-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Bölüm Bölüm Çalışılacak Yerler & Sınav Notları (
                {guide.sectionNotes.length} Bölüm)
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Quiz soruları öncelikli olarak bu bölüm notlarından üretilir
            </span>
          </div>
          <div className="space-y-3">
            {guide.sectionNotes.map((sec, idx) => (
              <div
                key={`${sec.sectionTitle}-${idx}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                    {idx + 1}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {sec.sectionTitle}
                  </h4>
                </div>

                {sec.whatToKnow.length > 0 && (
                  <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                    {sec.whatToKnow.map((fact, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {sec.examKeywords.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {sec.examKeywords.map((kw, kIdx) => (
                      <span
                        key={kIdx}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}

                {sec.likelyQuestionAngle && (
                  <div className="mt-3 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                    <span className="font-semibold">Sınavda Nasıl Sorulur:</span>{" "}
                    {sec.likelyQuestionAngle}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-indigo-500/25 bg-indigo-500/10 p-4 text-xs text-indigo-900 sm:flex-row sm:items-center dark:text-indigo-200">
          <div>
            <p className="font-bold">
              Bölüm Bölüm Detaylı Çalışma Notları İçin Rehberi Yenile
            </p>
            <p className="mt-0.5 text-indigo-800/80 dark:text-indigo-200/80">
              Bu ünite önceki kısa özet formatıyla üretilmiş. Eksiksiz kapsam
              denetimiyle tüm alt başlıkları ve istisnaları çıkarmak için
              yeniden üretebilirsin.
            </p>
          </div>
          <button
            type="button"
            disabled={isGeneratingGuide || !hasRawText}
            onClick={() => void onGenerateGuide()}
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isGeneratingGuide ? "animate-spin" : ""}`}
            />
            Detaylı Rehberi Üret
          </button>
        </div>
      )}

      {guide.sectionNotes &&
        guide.sectionNotes.length > 0 &&
        !guide.coverageReport && (
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-xs text-amber-900 sm:flex-row sm:items-center dark:text-amber-200">
            <div>
              <p className="font-bold">
                Kapsam Denetimi & Yeni AÖF Kuralları Güncellemesi Mevcut
              </p>
              <p className="mt-0.5 opacity-85">
                Yeni kural dosyasına göre eksik başlık tamamlayıcı, karşılaştırma
                tabloları ve doğrulama notları için bu rehberi yenileyebilirsin.
              </p>
            </div>
            <button
              type="button"
              disabled={isGeneratingGuide || !hasRawText}
              onClick={() => void onGenerateGuide()}
              className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-50 sm:self-auto"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isGeneratingGuide ? "animate-spin" : ""}`}
              />
              Eksiksiz Güncelle
            </button>
          </div>
        )}

      {/* Karşılaştırma Tabloları (varsa) */}
      {guide.comparisonTables && guide.comparisonTables.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Table2 className="h-4 w-4 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Karşılaştırma & Sınıflandırma Tabloları
            </h3>
          </div>
          {guide.comparisonTables.map((tbl, tIdx) => (
            <div
              key={`${tbl.title}-${tIdx}`}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-100">
                {tbl.title}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900">
                      {tbl.columns.map((col, cIdx) => (
                        <th
                          key={cIdx}
                          className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-200"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {tbl.rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`px-4 py-2.5 text-slate-600 dark:text-slate-300 ${
                              cIdx === 0 ? "font-semibold text-slate-900 dark:text-white" : ""
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sınavda Çıkabilecek Kritik Ayrıntılar */}
      {guide.criticalDetails && guide.criticalDetails.length > 0 && (
        <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 p-5 dark:bg-rose-500/10">
          <h3 className="flex items-center gap-2 text-sm font-bold text-rose-800 dark:text-rose-200">
            <AlertTriangle className="h-4 w-4 text-rose-500" />
            Sınavda Çıkabilecek Kritik Ayrıntılar (İstisnalar, Tarihler & Sınırlayıcılar)
          </h3>
          <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
            {guide.criticalDetails.map((detail, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Kritik Kavramlar */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Sınavda Çıkma İhtimali Yüksek Kritik Kavramlar (
            {guide.criticalConcepts.length})
          </h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {guide.criticalConcepts.map((concept, idx) => (
            <div
              key={`${concept.term}-${idx}`}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {concept.term}
                  </h4>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      concept.importance === "yuksek"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                    }`}
                  >
                    {concept.importance === "yuksek"
                      ? "Çok Kritik"
                      : "Önemli"}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {concept.definition}
                </p>
              </div>
              <div className="mt-3 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                <span className="font-semibold">AÖF Sınav İpucu:</span>{" "}
                {concept.examTip}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nasıl Çalışmalısın? (Eylem Planı) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-indigo-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Nasıl Çalışmalısın? • {guide.studyPlan.approachTitle}
          </h3>
        </div>

        {/* Genel Çalışma Adımları */}
        <div className="mt-4 space-y-2">
          {guide.studyPlan.actionSteps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                {idx + 1}
              </span>
              <span>{step}</span>
            </div>
          ))}
        </div>

        {/* Sözel Derslere Özel Bölümler */}
        {!isTeknik && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {guide.studyPlan.keyDefinitionsFocus &&
              guide.studyPlan.keyDefinitionsFocus.length > 0 && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Odaklanılacak Tanımlar ve Farklar
                  </h4>
                  <ul className="mt-2.5 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {guide.studyPlan.keyDefinitionsFocus.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {guide.studyPlan.memorizationTips &&
              guide.studyPlan.memorizationTips.length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <h4 className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                    <Lightbulb className="h-4 w-4" />
                    Ezber ve Akılda Tutma İpuçları
                  </h4>
                  <ul className="mt-2.5 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {guide.studyPlan.memorizationTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        )}

        {/* Teknik Derslere Özel Bölümler: Kod/Formül Parçalama + Mini Pratik Görevler */}
        {isTeknik && (
          <div className="mt-6 space-y-6">
            {guide.studyPlan.codeBreakdowns &&
              guide.studyPlan.codeBreakdowns.length > 0 && (
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                    <Terminal className="h-4 w-4 text-sky-500" />
                    Kod / Formül Mantığı Analizi
                  </h4>
                  {guide.studyPlan.codeBreakdowns.map((block, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {block.title}
                        </span>
                        <span className="rounded-md bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-600 uppercase dark:text-sky-400">
                          {block.language}
                        </span>
                      </div>
                      <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900 p-3.5 text-xs leading-relaxed text-slate-100">
                        <code>{block.codeOrFormula}</code>
                      </pre>
                      <div className="mt-3 space-y-1.5">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase dark:text-slate-400">
                          Adım Adım Çalışma Mantığı
                        </div>
                        {block.stepByStepLogic.map((step, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                          >
                            <span className="font-mono font-bold text-sky-500">
                              {sIdx + 1}.
                            </span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                      {block.commonTrap && (
                        <div className="mt-3 flex items-start gap-2 rounded-lg bg-rose-500/10 p-2.5 text-xs text-rose-700 dark:text-rose-300">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>
                            <strong>Sık Yapılan Sınav Tuzağı:</strong>{" "}
                            {block.commonTrap}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

            {guide.studyPlan.practiceTasks &&
              guide.studyPlan.practiceTasks.length > 0 && (
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                    <Play className="h-4 w-4 text-emerald-500" />
                    Bilgisayarda Dene: Mini Pratik Görevler
                  </h4>
                  <div className="grid gap-3 md:grid-cols-3">
                    {guide.studyPlan.practiceTasks.map((task, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col justify-between rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4"
                      >
                        <div>
                          <span className="text-[11px] font-bold text-emerald-600 uppercase dark:text-emerald-400">
                            Görev {idx + 1}
                          </span>
                          <h5 className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                            {task.title}
                          </h5>
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                            {task.instruction}
                          </p>
                        </div>
                        <div className="mt-3 rounded-lg bg-white/70 p-2 text-[11px] text-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                          <strong>Beklenen Çıktı:</strong> {task.expectedOutcome}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Kitaptan Doğrulanması Gereken Yerler & Kapsam Kontrolü */}
      {(guide.verificationNotes?.length || guide.coverageReport) && (
        <div className="grid gap-4 md:grid-cols-2">
          {guide.verificationNotes && guide.verificationNotes.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Kitaptan Doğrulanması Gereken Yerler
              </h4>
              <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {guide.verificationNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {guide.coverageReport && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Kapsam Kontrolü
                </h4>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    guide.coverageReport.missedHeadings.length === 0
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {guide.coverageReport.missedHeadings.length === 0
                    ? "Atladığım başlık: Yok"
                    : `${guide.coverageReport.missedHeadings.length} eksik başlık`}
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                <strong>İşlenen başlıklar ({guide.coverageReport.coveredHeadings.length}):</strong>{" "}
                {guide.coverageReport.coveredHeadings.join(", ")}
              </p>

              {guide.coverageReport.autoCompletedCount ? (
                <p className="mt-1.5 text-[11px] text-indigo-600 dark:text-indigo-400">
                  Otomatik kapsam denetimi ile ilk turda kalan{" "}
                  {guide.coverageReport.autoCompletedCount} bölüm tamamlama turunda eklendi.
                </p>
              ) : null}

              {guide.coverageReport.missedHeadings.length > 0 && (
                <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-300">
                  <strong>Atlanan/Kısmi Başlıklar:</strong>{" "}
                  {guide.coverageReport.missedHeadings.join(", ")}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Kural 9 Dürüstlük Hatırlatması */}
      <div className="rounded-xl border border-slate-200/80 bg-slate-100/70 px-4 py-2.5 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
        <strong>Çalışma Notu:</strong> Bu özet ve bölüm notları sınava
        hazırlığı hızlandırmak içindir; sınavda tam hakimiyet için orijinal AÖF
        ünite kitabını ve gerçek çıkmış soruları da mutlaka kontrol et.
      </div>

      {/* İsteğe Bağlı: Rehberi Okuduktan Sonra Kendi Cümlelerinle Pekiştir */}
      {hasRawText && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <MessageSquareCheck className="h-4 w-4 text-emerald-500" />
                Kendi Cümlelerinle Pekiştir (İsteğe Bağlı)
              </h4>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Notları bitirdikten sonra dilersen 3 kısa soruyla konuyu kendi
                cümlelerinle özetleyip eksiklerini kontrol edebilirsin (Quizler
                her zaman 5 şıklıdır).
              </p>
            </div>
            <button
              type="button"
              disabled={compState.loading}
              onClick={() =>
                compState.open && compState.prompts.length > 0
                  ? patchCompState((s) => ({ ...s, open: false }))
                  : void generateSelfCheck()
              }
              className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20 disabled:opacity-50 sm:self-auto dark:text-emerald-300"
            >
              {compState.loading &&
              !compState.feedback &&
              compState.prompts.length === 0 ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Hazırlanıyor...
                </>
              ) : compState.open ? (
                "Gizle"
              ) : (
                "Anlama Kontrolü Oluştur"
              )}
            </button>
          </div>

          {compState.error && (
            <div className="mt-3 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
              {compState.error}
            </div>
          )}

          {compState.open && compState.prompts.length > 0 && (
            <div className="mt-4 space-y-4 border-t border-slate-200 pt-4 dark:border-slate-800">
              {compState.prompts.map((cp, idx) => {
                const fb = compState.feedback?.find((f) => f.id === cp.id);
                return (
                  <div
                    key={cp.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40"
                  >
                    <div className="text-xs font-bold text-slate-800 dark:text-white">
                      {idx + 1}. {cp.topic}
                    </div>
                    <p className="mt-1 text-xs text-slate-700 dark:text-slate-200">
                      {cp.question}
                    </p>
                    <textarea
                      rows={2}
                      value={compState.answers[cp.id] || ""}
                      onChange={(e) =>
                        patchCompState((s) => ({
                          ...s,
                          answers: { ...s.answers, [cp.id]: e.target.value },
                        }))
                      }
                      placeholder="Kendi cümlelerinle kısaca anlat..."
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                    {fb && (
                      <div
                        className={`mt-2.5 rounded-lg p-3 text-xs ${
                          fb.scoreLabel === "tam"
                            ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                            : fb.scoreLabel === "kismi"
                              ? "bg-amber-500/10 text-amber-800 dark:text-amber-200"
                              : "bg-rose-500/10 text-rose-800 dark:text-rose-200"
                        }`}
                      >
                        <div className="font-bold">
                          Değerlendirme:{" "}
                          {fb.scoreLabel === "tam"
                            ? "Tam Anlaşılmış"
                            : fb.scoreLabel === "kismi"
                              ? "Kısmen Doğru"
                              : "Eksik / Tekrar Gerekli"}
                        </div>
                        <p className="mt-1">
                          <strong>Doğru Nokta:</strong> {fb.whatWasRight}
                        </p>
                        <p className="mt-0.5">
                          <strong>Eksik / Düzeltme:</strong> {fb.missingOrWrong}
                        </p>
                        <p className="mt-0.5 opacity-80">
                          <strong>Dayanak:</strong> {fb.sourceReference}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={compState.loading}
                  onClick={() => void evaluateSelfCheck()}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {compState.loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Kontrol Ediliyor...
                    </>
                  ) : (
                    "Yanıtlarımı Kitapla Karşılaştır"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
