"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Code2,
  Edit3,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
  AlertCircle,
  Clock,
  FileCheck2,
  Play,
} from "lucide-react";
import { TOTAL_UNITS, VIZE_UNIT_LIMIT } from "@/data/courses";
import { useCoach } from "@/context/CoachContext";
import { getDaysRemaining } from "@/lib/classifier";
import { CourseCategory } from "@/types/coach";

const STAGE_LABELS = ["1. Gün", "3. Gün", "7. Gün", "14. Gün"] as const;

export function DashboardView() {
  const {
    state,
    getCourseProgress,
    getUnitRecord,
    selectCourse,
    advanceReviewItem,
    resolveReviewItem,
    deleteReviewItem,
    startWeakTopicQuiz,
    addCourse,
    loadSampleCurriculum,
    setActiveView,
    updateExamDates,
  } = useCoach();

  const [editingDates, setEditingDates] = useState(false);
  const [vizeInput, setVizeInput] = useState(state.examDates.vizeDate);
  const [finalInput, setFinalInput] = useState(state.examDates.finalDate);
  const [showResolved, setShowResolved] = useState(false);
  const [nowTimestamp] = useState<number>(() => Date.now());
  const [quickCourseName, setQuickCourseName] = useState("");
  const [quickCourseCode, setQuickCourseCode] = useState("");
  const [quickCategory, setQuickCategory] = useState<CourseCategory | "auto">(
    "auto"
  );

  const handleQuickAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCourseName.trim()) return;
    const created = addCourse(
      quickCourseName,
      quickCategory === "auto" ? undefined : quickCategory,
      undefined,
      quickCourseCode
    );
    setQuickCourseName("");
    setQuickCourseCode("");
    setQuickCategory("auto");
    selectCourse(created.id, 1, "upload");
  };

  const vizeDays = getDaysRemaining(state.examDates.vizeDate);
  const finalDays = getDaysRemaining(state.examDates.finalDate);

  // Tüm dersler genelinde Vize ve Final ortalaması
  const overallTotals = state.courses.reduce(
    (acc, course) => {
      const p = getCourseProgress(course.id);
      acc.vizeDone += p.vizeCompleted;
      acc.vizeTotal += p.vizeTotal;
      acc.finalDone += p.finalCompleted;
      acc.finalTotal += p.finalTotal;
      return acc;
    },
    { vizeDone: 0, vizeTotal: 0, finalDone: 0, finalTotal: 0 }
  );

  const overallVizePct = overallTotals.vizeTotal
    ? Math.round((overallTotals.vizeDone / overallTotals.vizeTotal) * 100)
    : 0;
  const overallFinalPct = overallTotals.finalTotal
    ? Math.round((overallTotals.finalDone / overallTotals.finalTotal) * 100)
    : 0;

  const openReviews = state.reviewItems.filter((item) => !item.resolved);
  const displayedReviews = showResolved ? state.reviewItems : openReviews;

  const handleSaveDates = (e: React.FormEvent) => {
    e.preventDefault();
    updateExamDates({
      vizeDate: vizeInput || state.examDates.vizeDate,
      finalDate: finalInput || state.examDates.finalDate,
    });
    setEditingDates(false);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Üst Karşılama ve Sınav Tarihleri Düzenleme */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            AÖF &amp; Kişisel Sınav Asistanı
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Çalışma İlerlemesi ve Sınav Paneli
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sol panelden veya aşağıdan istediğin dersi ekleyip ünitelerini
            yükle; Vize (1–4) ve Final (1–8) hazırlığını tek ekrandan yönet.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView("exam")}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
          >
            <FileCheck2 className="h-3.5 w-3.5" />
            Deneme Sınavı Başlat
          </button>
          <button
            type="button"
            onClick={() => {
              setVizeInput(state.examDates.vizeDate);
              setFinalInput(state.examDates.finalDate);
              setEditingDates((prev) => !prev);
            }}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Sınav Tarihlerini Düzenle
          </button>
        </div>
      </div>

      {editingDates && (
        <form
          onSubmit={handleSaveDates}
          className="grid gap-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5 sm:grid-cols-3 dark:bg-indigo-500/10"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Vize (Ara Sınav) Tarihi
            </label>
            <input
              type="date"
              value={vizeInput}
              onChange={(e) => setVizeInput(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Final (Dönem Sonu) Tarihi
            </label>
            <input
              type="date"
              value={finalInput}
              onChange={(e) => setFinalInput(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Tarihleri Kaydet
            </button>
            <button
              type="button"
              onClick={() => setEditingDates(false)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300"
            >
              İptal
            </button>
          </div>
        </form>
      )}

      {/* Vize ve Final Sayacı Kartları */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Vize Kartı */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Target className="h-3.5 w-3.5" />
                Vize Kapsamı • İlk 4 Ünite
              </span>
              <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                Ara Sınava{" "}
                {vizeDays > 0
                  ? `${vizeDays} Gün Kaldı`
                  : vizeDays === 0
                    ? "Bugün!"
                    : `${Math.abs(vizeDays)} Gün Geçti`}
              </h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                Hedef Tarih: {state.examDates.vizeDate}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                %{overallVizePct}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {overallTotals.vizeDone} / {overallTotals.vizeTotal} ünite
              </div>
            </div>
          </div>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${overallVizePct}%` }}
            />
          </div>
        </div>

        {/* Final Kartı */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <Target className="h-3.5 w-3.5" />
                Final Kapsamı • Tüm 8 Ünite
              </span>
              <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                Final Sınavına{" "}
                {finalDays > 0
                  ? `${finalDays} Gün Kaldı`
                  : finalDays === 0
                    ? "Bugün!"
                    : `${Math.abs(finalDays)} Gün Geçti`}
              </h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                Hedef Tarih: {state.examDates.finalDate}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                %{overallFinalPct}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {overallTotals.finalDone} / {overallTotals.finalTotal} ünite
              </div>
            </div>
          </div>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${overallFinalPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Ders Bazlı İlerleme Kartları */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Dersler ve Ünite Matrisi
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Ünite numarasına tıklayarak doğrudan çalışmaya geçebilirsin
          </span>
        </div>

        {state.courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-indigo-400/50 bg-white p-6 shadow-xs dark:border-indigo-500/30 dark:bg-slate-900">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  İlk Dersini Ekleyerek Başla
                </h4>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  İstediğin dersin adını yazıp ekle; doğrudan 1. ünite içerik
                  yükleme ekranı açılır. PDF veya ders notlarını yükleyip
                  rehber, A4 çıktı ve 5 şıklı quiz oluşturabilirsin.
                </p>
              </div>
              <button
                type="button"
                onClick={loadSampleCurriculum}
                className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                Demo: Örnek 6 Dersi Yükle
              </button>
            </div>

            <form
              onSubmit={handleQuickAddCourse}
              className="mt-4 grid gap-3 sm:grid-cols-4"
            >
              <input
                type="text"
                value={quickCourseName}
                onChange={(e) => setQuickCourseName(e.target.value)}
                placeholder="Ders adı (örn: Genel Muhasebe)"
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none sm:col-span-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={quickCourseCode}
                  onChange={(e) => setQuickCourseCode(e.target.value)}
                  placeholder="Kod (örn: MUH101)"
                  className="w-1/2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                <select
                  value={quickCategory}
                  onChange={(e) =>
                    setQuickCategory(e.target.value as CourseCategory | "auto")
                  }
                  className="w-1/2 rounded-xl border border-slate-300 bg-slate-50 px-2 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="auto">Otomatik</option>
                  <option value="sozel">Sözel</option>
                  <option value="teknik">Teknik</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={!quickCourseName.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                Dersi Ekle &amp; Yükle
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {state.courses.map((course) => {
            const progress = getCourseProgress(course.id);
            const isTech = course.category === "teknik";
            return (
              <div
                key={course.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-400/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          isTech
                            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {isTech ? (
                          <Code2 className="h-3 w-3" />
                        ) : (
                          <BookOpen className="h-3 w-3" />
                        )}
                        {isTech ? "Teknik / Kodlama" : "Sözel / Kavramsal"}
                      </span>
                      <h4 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                        {course.name}
                      </h4>
                    </div>
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-mono text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {course.code}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                    {course.description}
                  </p>

                  {/* Vize ve Final Yüzdeleri */}
                  <div className="mt-4 space-y-2">
                    <div>
                      <div className="mb-1 flex justify-between text-[11px]">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          Vize (1–4. Ünite)
                        </span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          %{progress.vizePercent} ({progress.vizeCompleted}/4)
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-all"
                          style={{ width: `${progress.vizePercent}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-[11px]">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          Final (1–8. Ünite)
                        </span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          %{progress.finalPercent} ({progress.finalCompleted}/8)
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${progress.finalPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 8 Ünite Durum Kutucukları */}
                  <div className="mt-4">
                    <div className="grid grid-cols-8 gap-1.5">
                      {Array.from({ length: TOTAL_UNITS }, (_, i) => i + 1).map(
                        (unitNum) => {
                          const rec = getUnitRecord(course.id, unitNum);
                          const hasContent =
                            rec.rawText.trim().length > 0 || Boolean(rec.guide);
                          const isVize = unitNum <= VIZE_UNIT_LIMIT;
                          return (
                            <button
                              key={unitNum}
                              type="button"
                              onClick={() => selectCourse(course.id, unitNum, "upload")}
                              title={`Ünite ${unitNum} (${
                                isVize ? "Vize" : "Final"
                              })${rec.completed ? " • Tamamlandı" : ""}`}
                              className={`flex h-8 items-center justify-center rounded-lg text-xs font-semibold transition ${
                                rec.completed
                                  ? "bg-emerald-500 text-white shadow-xs"
                                  : hasContent
                                    ? "bg-indigo-500/15 text-indigo-600 ring-1 ring-indigo-500/40 dark:text-indigo-300"
                                    : isVize
                                      ? "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                              }`}
                            >
                              {unitNum}
                            </button>
                          );
                        }
                      )}
                    </div>
                    <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
                      <span>1–4 Vize</span>
                      <span>5–8 Final</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => selectCourse(course.id, 1, "upload")}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-2 text-xs font-semibold text-slate-700 transition hover:bg-indigo-600 hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-indigo-600"
                >
                  Derse Git
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Yanlış Defteri ve Aralıklı Tekrar Listesi */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="flex flex-wrap items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Yanlış Defteri & Aralıklı Tekrar (1–3–7–14. Gün)
              <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                {openReviews.length} zayıf konu
              </span>
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Quiz ve denemelerde yanlış yapılan konular otomatik buraya eklenir;
              1., 3., 7. ve 14. gün tekrarlarıyla kalıcı hâle getirilir.
            </p>
          </div>
          {state.reviewItems.length > 0 && (
            <button
              type="button"
              onClick={() => setShowResolved((p) => !p)}
              className="self-start rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {showResolved
                ? "Sadece Açık Konuları Göster"
                : `Tümünü Göster (${state.reviewItems.length})`}
            </button>
          )}
        </div>

        {openReviews.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs dark:bg-amber-500/10">
            <div className="font-bold text-amber-900 dark:text-amber-200">
              Öncelikli Zayıf Konular Sırası:
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {openReviews.slice(0, 8).map((item) => (
                <button
                  key={`prio-${item.id}`}
                  type="button"
                  onClick={() =>
                    startWeakTopicQuiz(item.courseId, item.unitNumber, [
                      item.topic,
                    ])
                  }
                  className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-xs hover:bg-indigo-600 hover:text-white dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-indigo-600"
                >
                  <span>
                    {item.courseName} Ü{item.unitNumber}: {item.topic}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {displayedReviews.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-8 text-center dark:border-slate-800">
            <CheckCircle2 className="h-8 w-8 text-emerald-500/80" />
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Harika! Şu an tekrar bekleyen eksik konu yok.
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Ders ünitelerinden veya Deneme Sınavı modundan soru çözdükçe hatalı
              konular burada toplanır.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {displayedReviews.map((item) => {
              const stageIdx = item.reviewStage ?? 0;
              const stageLabel =
                STAGE_LABELS[Math.min(stageIdx, STAGE_LABELS.length - 1)];
              const isDueNow =
                !item.resolved &&
                (!item.nextReviewAt ||
                  new Date(item.nextReviewAt).getTime() <= nowTimestamp);

              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between gap-3 rounded-xl border p-4 lg:flex-row lg:items-center ${
                    item.resolved
                      ? "border-slate-200/70 bg-slate-50/70 opacity-70 dark:border-slate-800/60 dark:bg-slate-800/30"
                      : isDueNow
                        ? "border-rose-500/35 bg-rose-500/5 dark:bg-rose-500/10"
                        : "border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-900/5 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                        {item.courseName} • Ünite {item.unitNumber}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.topic}
                      </span>
                      {!item.resolved && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isDueNow
                              ? "bg-rose-600 text-white"
                              : "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300"
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          {isDueNow
                            ? `Tekrar Vakti (${stageLabel})`
                            : `${stageLabel} Tekrarı`}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-semibold">Soru:</span>{" "}
                      {item.questionPreview}
                    </p>
                    {item.wrongChoice && (
                      <p className="text-xs text-rose-700 dark:text-rose-300">
                        <span className="font-semibold">Senin Yanlış Seçimin:</span>{" "}
                        {item.wrongChoice}
                      </p>
                    )}
                    {item.correctAnswerSummary && (
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">
                        <span className="font-semibold">Doğru Cevap & Gerekçe:</span>{" "}
                        {item.correctAnswerSummary}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {!item.resolved && (
                      <button
                        type="button"
                        onClick={() =>
                          startWeakTopicQuiz(item.courseId, item.unitNumber, [
                            item.topic,
                          ])
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                      >
                        <Play className="h-3 w-3" />
                        Tekrar Quizi
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        selectCourse(item.courseId, item.unitNumber, "guide")
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      Notlara Git
                    </button>
                    {!item.resolved && (
                      <button
                        type="button"
                        onClick={() => advanceReviewItem(item.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {stageIdx >= STAGE_LABELS.length - 1
                          ? "Tamamla"
                          : `Tekrar Ettim → ${STAGE_LABELS[stageIdx + 1]}`}
                      </button>
                    )}
                    {item.resolved && (
                      <button
                        type="button"
                        onClick={() => resolveReviewItem(item.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Geri Al
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteReviewItem(item.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500"
                      title="Listeden kaldır"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
