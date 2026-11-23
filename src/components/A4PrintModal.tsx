"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Printer, X } from "lucide-react";
import { useCoach } from "@/context/CoachContext";
import {
  A4_DOCUMENT_CSS,
  A4_PRINTABLE_HEIGHT_PX,
  buildStandaloneA4Html,
  slugifyFileName,
} from "@/lib/a4-export";
import { getCourseUnitConfig, getUnitExamInfo } from "@/lib/course-units";
import { Course, StudyGuide, UnitRecord } from "@/types/coach";

interface A4PrintModalProps {
  open: boolean;
  onClose: () => void;
  course: Course;
  initialUnitNumber: number;
}

type FontSizePreset = "xs" | "sm" | "md" | "lg";
type LayoutPreset = "one_page" | "compact" | "full";

interface PrintableUnitItem {
  unitNumber: number;
  record: UnitRecord;
}

function filterMeaningfulNotes(notes: string[] | undefined): string[] {
  if (!notes) return [];
  return notes.filter((n) => {
    const low = n.toLocaleLowerCase("tr-TR");
    return (
      n.trim().length > 0 &&
      !low.includes("şüpheli nokta bulunamadı") &&
      !low.includes("tutarlı görünmektedir")
    );
  });
}

function renderUnitGuideHtml(
  unitNum: number,
  course: Course,
  guide: StudyGuide,
  opts: {
    twoColumn: boolean;
    includeSections: boolean;
    includeAngles: boolean;
    includeTables: boolean;
    includeCriticalDetails: boolean;
    includeConcepts: boolean;
    includeStudyPlan: boolean;
  }
) {
  const isTeknik = (guide.detectedCategory || course.category) === "teknik";
  const unitCfg = getCourseUnitConfig(course);
  const examInfo = getUnitExamInfo(unitNum, unitCfg.vizeSet, unitCfg.finalSet);
  const meaningfulVerification = filterMeaningfulNotes(guide.verificationNotes);

  return (
    <article key={unitNum} className="a4-unit-block">
      <div className="a4-unit-inner">
        <header className="a4-doc-header">
          <div>
            <div className="a4-doc-kicker">
              {course.code} • AÖF Çalışma Notları (A4)
            </div>
            <h1 className="a4-doc-title">
              {course.name} — Ünite {unitNum}
            </h1>
          </div>
          <div className="a4-doc-meta">
            <div>
              <span className="a4-badge">{examInfo.badgeText}</span>
              <span className="a4-badge">{isTeknik ? "Teknik" : "Sözel"}</span>
            </div>
            <div style={{ marginTop: "2px" }}>
              {new Date(guide.generatedAt).toLocaleDateString("tr-TR")}
            </div>
          </div>
        </header>

        {opts.includeSections && guide.unitSummary && (
          <div className="a4-summary-box">
            <strong>Ünite Özeti</strong>
            <p>{guide.unitSummary}</p>
          </div>
        )}

        <div className={opts.twoColumn ? "a4-cols-2" : undefined}>
          {opts.includeCriticalDetails &&
            guide.criticalDetails &&
            guide.criticalDetails.length > 0 && (
              <div className="a4-callout-warn">
                <div className="a4-callout-title">
                  Sınavda Çıkabilecek Kritik Ayrıntılar
                </div>
                <ul className="a4-list">
                  {guide.criticalDetails.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}

          {opts.includeTables &&
            guide.comparisonTables &&
            guide.comparisonTables.length > 0 && (
              <>
                <h2 className="a4-section-heading">Karşılaştırma Tabloları</h2>
                {guide.comparisonTables.map((tbl, tIdx) => (
                  <div key={tIdx} className="a4-table-wrap">
                    <div className="a4-table-title">{tbl.title}</div>
                    <table className="a4-table">
                      <thead>
                        <tr>
                          {tbl.columns.map((col, cIdx) => (
                            <th key={cIdx}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tbl.rows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </>
            )}

          {opts.includeSections &&
            guide.sectionNotes &&
            guide.sectionNotes.length > 0 && (
              <>
                <h2 className="a4-section-heading">
                  Bölüm Bölüm Çalışma Notları ({guide.sectionNotes.length} Bölüm)
                </h2>
                {guide.sectionNotes.map((sec, idx) => (
                  <section
                    key={`${sec.sectionTitle}-${idx}`}
                    className="a4-sec-card"
                  >
                    <div className="a4-sec-title">
                      <span className="a4-sec-num">{idx + 1}</span>
                      <span>{sec.sectionTitle}</span>
                    </div>
                    {sec.whatToKnow.length > 0 && (
                      <ul className="a4-list">
                        {sec.whatToKnow.map((fact, fIdx) => (
                          <li key={fIdx}>{fact}</li>
                        ))}
                      </ul>
                    )}
                    {sec.examKeywords.length > 0 && (
                      <div className="a4-keywords">
                        <strong>Kavramlar: </strong>
                        {sec.examKeywords.map((kw, kIdx) => (
                          <span key={kIdx} className="a4-kw-tag">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                    {opts.includeAngles && sec.likelyQuestionAngle && (
                      <div className="a4-angle">
                        <strong>Sınav Açısı:</strong> {sec.likelyQuestionAngle}
                      </div>
                    )}
                  </section>
                ))}
              </>
            )}

          {opts.includeConcepts && guide.criticalConcepts.length > 0 && (
            <>
              <h2 className="a4-section-heading">
                Kritik Kavramlar ({guide.criticalConcepts.length})
              </h2>
              <div className="a4-concept-list">
                {guide.criticalConcepts.map((c, idx) => (
                  <div
                    key={`${c.term}-${idx}`}
                    className={`a4-concept-card ${
                      c.importance === "yuksek" ? "is-high" : ""
                    }`}
                  >
                    <span className="a4-concept-term">
                      {c.term}
                      {c.importance === "yuksek" ? " ★" : ""}:{" "}
                    </span>
                    <span>{c.definition}</span>
                    {c.examTip && (
                      <div className="a4-concept-tip">
                        <strong>İpucu:</strong> {c.examTip}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {opts.includeStudyPlan && guide.studyPlan && (
            <>
              <h2 className="a4-section-heading">
                Çalışma Stratejisi: {guide.studyPlan.approachTitle}
              </h2>
              {guide.studyPlan.actionSteps.length > 0 && (
                <div className="a4-sec-card">
                  <strong>Uygulama Adımları</strong>
                  <ol className="a4-list">
                    {guide.studyPlan.actionSteps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {guide.studyPlan.keyDefinitionsFocus &&
                guide.studyPlan.keyDefinitionsFocus.length > 0 && (
                  <div className="a4-sec-card">
                    <strong>Karıştırılmaması Gereken İnce Ayrımlar</strong>
                    <ul className="a4-list">
                      {guide.studyPlan.keyDefinitionsFocus.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {guide.studyPlan.memorizationTips &&
                guide.studyPlan.memorizationTips.length > 0 && (
                  <div className="a4-sec-card">
                    <strong>Hafıza / Tekrar İpuçları</strong>
                    <ul className="a4-list">
                      {guide.studyPlan.memorizationTips.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {guide.studyPlan.codeBreakdowns &&
                guide.studyPlan.codeBreakdowns.length > 0 &&
                guide.studyPlan.codeBreakdowns.map((block, bIdx) => (
                  <div key={bIdx} className="a4-sec-card">
                    <strong>
                      {block.title} ({block.language})
                    </strong>
                    <pre className="a4-code-box">{block.codeOrFormula}</pre>
                    <ol className="a4-list">
                      {block.stepByStepLogic.map((s, sIdx) => (
                        <li key={sIdx}>{s}</li>
                      ))}
                    </ol>
                    {block.commonTrap && (
                      <div className="a4-angle">
                        <strong>Sık Sınav Tuzağı:</strong> {block.commonTrap}
                      </div>
                    )}
                  </div>
                ))}
            </>
          )}

          {opts.includeCriticalDetails && meaningfulVerification.length > 0 && (
            <div className="a4-callout-warn">
              <div className="a4-callout-title">
                Kitaptan Doğrulanması Gereken Yerler
              </div>
              <ul className="a4-list">
                {meaningfulVerification.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <footer className="a4-footer-note">
          Not: Bu A4 çıktısı sınava hazırlığı hızlandırmak içindir; tam hakimiyet
          için resmi AÖF ders kitabını ve çıkmış soruları mutlaka gözden geçirin.
        </footer>
      </div>
    </article>
  );
}

export function A4PrintModal({
  open,
  onClose,
  course,
  initialUnitNumber,
}: A4PrintModalProps) {
  const { getUnitRecord } = useCoach();
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const [selectedUnits, setSelectedUnits] = useState<number[]>([
    initialUnitNumber,
  ]);
  const [layoutPreset, setLayoutPreset] = useState<LayoutPreset>("one_page");
  const [twoColumn, setTwoColumn] = useState(true);
  const [fitOnePage, setFitOnePage] = useState(true);
  const [fontSize, setFontSize] = useState<FontSizePreset>("xs");
  const [includeSections, setIncludeSections] = useState(true);
  const [includeAngles, setIncludeAngles] = useState(false);
  const [includeTables, setIncludeTables] = useState(true);
  const [includeCriticalDetails, setIncludeCriticalDetails] = useState(true);
  const [includeConcepts, setIncludeConcepts] = useState(true);
  const [includeStudyPlan, setIncludeStudyPlan] = useState(false);
  const [includeRawFallback, setIncludeRawFallback] = useState(true);
  const fitStatusRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("a4-print-mode");
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("a4-print-mode");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  // Tek Sayfa A4 modu aktifken her ünitenin doğal yüksekliğini ölçüp
  // gerekirse otomatik zoom ile kesin olarak 1 A4 sayfasına sığdır
  useLayoutEffect(() => {
    if (!open || !sheetRef.current) return;
    const inners = sheetRef.current.querySelectorAll<HTMLElement>(".a4-unit-inner");
    let minZoom = 1;

    inners.forEach((el) => {
      el.style.zoom = "1";
      if (!fitOnePage) return;
      const naturalHeight = el.scrollHeight;
      if (naturalHeight > A4_PRINTABLE_HEIGHT_PX) {
        const computed = Math.max(
          0.52,
          Number((A4_PRINTABLE_HEIGHT_PX / naturalHeight).toFixed(3))
        );
        el.style.zoom = String(computed);
        if (computed < minZoom) minZoom = computed;
      }
    });

    if (fitStatusRef.current) {
      if (!fitOnePage) {
        fitStatusRef.current.textContent = "Doğal Akış (Sayfa Bölünmesi Yok)";
      } else if (minZoom < 0.999) {
        fitStatusRef.current.textContent = `✓ Her Ünite 1 A4 Sayfasına Sığdırıldı (%${Math.round(
          minZoom * 100
        )})`;
      } else {
        fitStatusRef.current.textContent = "✓ Her Ünite 1 A4 Sayfasına Tam Sığıyor";
      }
    }
  }, [
    open,
    fitOnePage,
    twoColumn,
    fontSize,
    selectedUnits,
    includeSections,
    includeAngles,
    includeTables,
    includeCriticalDetails,
    includeConcepts,
    includeStudyPlan,
    includeRawFallback,
  ]);

  if (!open || typeof document === "undefined") return null;

  const unitCfg = getCourseUnitConfig(course);
  const allUnits: PrintableUnitItem[] = unitCfg.unitNumbers.map((u) => ({
    unitNumber: u,
    record: getUnitRecord(course.id, u),
  }));

  const printableUnits = allUnits.filter((item) => {
    if (!selectedUnits.includes(item.unitNumber)) return false;
    return Boolean(
      item.record.guide ||
        (includeRawFallback && item.record.rawText.trim().length >= 50)
    );
  });

  const toggleUnit = (u: number) => {
    setSelectedUnits((prev) =>
      prev.includes(u)
        ? prev.length > 1
          ? prev.filter((x) => x !== u)
          : prev
        : [...prev, u].sort((a, b) => a - b)
    );
  };

  const applyPreset = (mode: "single" | "vize" | "final" | "all") => {
    if (mode === "single") {
      setSelectedUnits([initialUnitNumber]);
      return;
    }
    const matching = allUnits
      .filter((item) => {
        if (mode === "vize" && !unitCfg.vizeSet.has(item.unitNumber)) return false;
        if (mode === "final" && !unitCfg.finalSet.has(item.unitNumber)) return false;
        return Boolean(
          item.record.guide ||
            (includeRawFallback && item.record.rawText.trim().length >= 50)
        );
      })
      .map((item) => item.unitNumber);
    if (matching.length > 0) setSelectedUnits(matching);
  };

  const applyLayoutPreset = (preset: LayoutPreset) => {
    setLayoutPreset(preset);
    if (preset === "one_page") {
      setFitOnePage(true);
      setTwoColumn(true);
      setFontSize("xs");
      setIncludeAngles(false);
      setIncludeStudyPlan(false);
      setIncludeCriticalDetails(true);
      setIncludeTables(true);
      setIncludeConcepts(true);
      setIncludeSections(true);
    } else if (preset === "compact") {
      setFitOnePage(false);
      setTwoColumn(true);
      setFontSize("sm");
      setIncludeAngles(false);
      setIncludeStudyPlan(false);
      setIncludeCriticalDetails(true);
      setIncludeTables(true);
      setIncludeConcepts(true);
      setIncludeSections(true);
    } else {
      setFitOnePage(false);
      setTwoColumn(false);
      setFontSize("md");
      setIncludeAngles(true);
      setIncludeStudyPlan(true);
      setIncludeCriticalDetails(true);
      setIncludeTables(true);
      setIncludeConcepts(true);
      setIncludeSections(true);
    }
  };

  const handleDownloadHtml = () => {
    if (!sheetRef.current) return;
    const html = buildStandaloneA4Html(
      `${course.name} - Ünite ${selectedUnits.join(", ")} A4 Notları`,
      sheetRef.current.outerHTML
    );
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugifyFileName(course.name)}_Unite_${selectedUnits.join("-")}_A4.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const modalContent = (
    <div
      id="a4-print-portal"
      className="fixed inset-0 z-50 flex flex-col bg-slate-900/90 backdrop-blur-xs"
    >
      <style>{A4_DOCUMENT_CSS}</style>

      {/* Kontrol Çubuğu (Yazdırmada Gizlenir) */}
      <div className="a4-no-print shrink-0 border-b border-slate-700 bg-slate-900 px-4 py-3 text-slate-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">
              A4 Kağıdı Çıktısı & PDF Önizleme — {course.name}
            </h3>
            <p className="text-[11px] text-slate-400">
              Yazdırma penceresinde <strong>&quot;PDF olarak kaydet&quot;</strong> veya
              A4 yazıcını seçerek doğrudan kâğıda dökebilirsin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={printableUnits.length === 0}
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              A4 Yazdır / PDF Kaydet
            </button>
            <button
              type="button"
              disabled={printableUnits.length === 0}
              onClick={handleDownloadHtml}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              A4 HTML İndir
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
              Kapat
            </button>
          </div>
        </div>

        <div className="mx-auto mt-3 flex max-w-6xl flex-wrap items-center gap-4 border-t border-slate-800 pt-2.5 text-xs">
          {/* Ünite Seçimi */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400">
              Üniteler:
            </span>
            {allUnits.map(({ unitNumber, record }) => {
              const hasContent = Boolean(
                record.guide || record.rawText.trim().length >= 50
              );
              const checked = selectedUnits.includes(unitNumber);
              return (
                <button
                  key={unitNumber}
                  type="button"
                  disabled={!hasContent}
                  onClick={() => toggleUnit(unitNumber)}
                  title={
                    record.guide
                      ? `Ünite ${unitNumber} (Rehber Hazır)`
                      : hasContent
                        ? `Ünite ${unitNumber} (Ham Metin)`
                        : `Ünite ${unitNumber} (Boş)`
                  }
                  className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
                    !hasContent
                      ? "cursor-not-allowed bg-slate-800/40 text-slate-600"
                      : checked
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Ü{unitNumber}
                  {record.guide ? "" : hasContent ? "*" : ""}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => applyPreset("single")}
              className="ml-1 rounded-lg bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700"
            >
              Tek Ünite
            </button>
            <button
              type="button"
              onClick={() => applyPreset("vize")}
              className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] text-amber-300 hover:bg-slate-700"
            >
              Vize ({unitCfg.vizeLabel})
            </button>
            {unitCfg.finalUnits.length < unitCfg.totalUnits && (
              <button
                type="button"
                onClick={() => applyPreset("final")}
                className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] text-indigo-300 hover:bg-slate-700"
              >
                Final ({unitCfg.finalLabel})
              </button>
            )}
            <button
              type="button"
              onClick={() => applyPreset("all")}
              className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] text-emerald-300 hover:bg-slate-700"
            >
              Tümü
            </button>
          </div>

          {/* Düzen & Yazı Boyutu */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5">
              <button
                type="button"
                onClick={() => applyLayoutPreset("one_page")}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                  layoutPreset === "one_page"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Tek Sayfa A4
              </button>
              <button
                type="button"
                onClick={() => applyLayoutPreset("compact")}
                className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                  layoutPreset === "compact"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                2 Sütun Akış
              </button>
              <button
                type="button"
                onClick={() => applyLayoutPreset("full")}
                className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                  layoutPreset === "full"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Tek Sütun Detaylı
              </button>
            </div>

            <div className="inline-flex rounded-lg bg-slate-800 p-0.5">
              {(["xs", "sm", "md", "lg"] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setFontSize(sz)}
                  className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                    fontSize === sz
                      ? "bg-slate-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {sz === "xs"
                    ? "Sıkı"
                    : sz === "sm"
                      ? "Küçük"
                      : sz === "md"
                        ? "Orta"
                        : "Büyük"}
                </button>
              ))}
            </div>

            <span
              ref={fitStatusRef}
              className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300"
            >
              ✓ Her Ünite 1 A4 Sayfasına Sığdırıldı
            </span>
          </div>
        </div>

        {/* Bölümler Checkbox Barı */}
        <div className="mx-auto mt-2 flex max-w-6xl flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-300">
          <label className="inline-flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={includeSections}
              onChange={(e) => setIncludeSections(e.target.checked)}
            />
            Özet & Bölüm Notları
          </label>
          <label className="inline-flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={includeAngles}
              onChange={(e) => setIncludeAngles(e.target.checked)}
            />
            Sınavda Nasıl Sorulur
          </label>
          <label className="inline-flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={includeTables}
              onChange={(e) => setIncludeTables(e.target.checked)}
            />
            Karşılaştırma Tabloları
          </label>
          <label className="inline-flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={includeCriticalDetails}
              onChange={(e) => setIncludeCriticalDetails(e.target.checked)}
            />
            Kritik Ayrıntılar
          </label>
          <label className="inline-flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={includeConcepts}
              onChange={(e) => setIncludeConcepts(e.target.checked)}
            />
            Kritik Kavramlar
          </label>
          <label className="inline-flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={includeStudyPlan}
              onChange={(e) => setIncludeStudyPlan(e.target.checked)}
            />
            Çalışma Stratejisi & Kodlar
          </label>
          <label className="inline-flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={includeRawFallback}
              onChange={(e) => setIncludeRawFallback(e.target.checked)}
            />
            Rehbersiz Ünitelerde Ham Metin (*)
          </label>
        </div>
      </div>

      {/* Canlı A4 Sayfa Önizleme Alanı */}
      <div className="a4-preview-scroll flex-1 overflow-y-auto bg-slate-800 p-4 sm:p-8 print:overflow-visible print:bg-white print:p-0">
        {printableUnits.length === 0 ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center text-xs text-slate-300">
            Seçilen üniteler için henüz çalışma rehberi veya ders metni
            bulunmuyor. Önce ünite içeriği yükleyip Çalışma Rehberi oluşturun.
          </div>
        ) : (
          <div
            ref={sheetRef}
            className={`a4-sheet a4-size-${fontSize} ${
              fitOnePage ? "a4-mode-one-page" : ""
            }`}
          >
            {printableUnits.map(({ unitNumber, record }) => {
              if (record.guide) {
                return renderUnitGuideHtml(unitNumber, course, record.guide, {
                  twoColumn,
                  includeSections,
                  includeAngles,
                  includeTables,
                  includeCriticalDetails,
                  includeConcepts,
                  includeStudyPlan,
                });
              }

              return (
                <article key={unitNumber} className="a4-unit-block">
                  <div className="a4-unit-inner">
                    <header className="a4-doc-header">
                      <div>
                        <div className="a4-doc-kicker">
                          {course.code} • Ham Ünite Metni (A4)
                        </div>
                        <h1 className="a4-doc-title">
                          {course.name} — Ünite {unitNumber}
                        </h1>
                      </div>
                      <div className="a4-doc-meta">
                        <span className="a4-badge">
                          {record.fileName || "Yapıştırılmış Metin"}
                        </span>
                      </div>
                    </header>
                    <div className="a4-callout-warn">
                      <div className="a4-callout-title">Bilgi Notu</div>
                      <div>
                        Bu ünite için henüz AI Çalışma Rehberi üretilmediğinden
                        yüklenen ham ders metni basıma hazırlanmıştır.
                      </div>
                    </div>
                    <div
                      className={`a4-raw-text ${twoColumn ? "a4-cols-2" : ""}`}
                    >
                      {record.rawText}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
