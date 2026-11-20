"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  HelpCircle,
  History,
  Loader2,
  MinusCircle,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { AnswerKeySection } from "@/components/AnswerKeySection";
import { useCoach } from "@/context/CoachContext";
import { calculateAofNet } from "@/lib/classifier";
import {
  AiGenerationMeta,
  QuizAttempt,
  QuizOptionKey,
  QuizQuestion,
  QuizScope,
} from "@/types/coach";

type QuestionCountOption = 5 | 10 | 15 | 20 | 25;
type QuizRevealMode = "immediate" | "end";

export function QuizTab() {
  const {
    selectedCourse,
    selectedUnitNumber,
    currentUnitRecord,
    recordQuizAttempt,
    setActiveView,
    setActiveSubTab,
    pendingWeakTopics,
    clearPendingWeakTopics,
    aiPreference,
    evrenModelPreference,
    clientAiOverride,
  } = useCoach();

  const hasGuide = Boolean(
    currentUnitRecord.guide &&
      (currentUnitRecord.guide.unitSummary ||
        currentUnitRecord.guide.sectionNotes?.length ||
        currentUnitRecord.guide.criticalConcepts?.length)
  );
  const hasDetailedGuide = Boolean(
    currentUnitRecord.guide?.sectionNotes?.length &&
      currentUnitRecord.guide?.coverageReport
  );

  const [questionCount, setQuestionCount] = useState<QuestionCountOption>(15);
  const [quizScope, setQuizScope] = useState<QuizScope>("guide_aligned");
  const [revealMode, setRevealMode] = useState<QuizRevealMode>("immediate");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizAiMeta, setQuizAiMeta] = useState<AiGenerationMeta | null>(null);

  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[] | null>(
    null
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuizOptionKey | "BOS">>(
    {}
  );
  const [finishedAttempt, setFinishedAttempt] = useState<QuizAttempt | null>(
    null
  );

  const hasRawText = currentUnitRecord.rawText.trim().length >= 50;

  if (!selectedCourse) return null;

  const startQuiz = async () => {
    if (!hasRawText) return;
    setIsLoading(true);
    setError(null);
    setFinishedAttempt(null);

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName: selectedCourse.name,
          category: selectedCourse.category,
          unitNumber: selectedUnitNumber,
          unitText: currentUnitRecord.rawText,
          questionCount,
          contentMode: currentUnitRecord.contentMode ?? "auto",
          quizScope: hasGuide ? quizScope : "full_text",
          studyGuide:
            hasGuide && quizScope === "guide_aligned"
              ? currentUnitRecord.guide
              : undefined,
          weakTopics:
            pendingWeakTopics.length > 0 ? pendingWeakTopics : undefined,
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
        throw new Error(data.error || "Quiz soruları üretilemedi.");
      }

      if (pendingWeakTopics.length > 0) {
        clearPendingWeakTopics();
      }
      setQuizAiMeta(data.aiMeta ?? null);
      setActiveQuestions(data.questions);
      setCurrentIdx(0);
      setAnswers({});
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Quiz oluşturulurken beklenmeyen bir hata oluştu."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAnswer = (
    questionId: string,
    choice: QuizOptionKey | "BOS"
  ) => {
    if (revealMode === "immediate" && answers[questionId]) return;
    setAnswers((prev) => ({ ...prev, [questionId]: choice }));
  };

  const finishActiveQuiz = () => {
    if (!activeQuestions) return;
    const stats = calculateAofNet(activeQuestions, answers);
    const attempt: QuizAttempt = {
      id: `quiz-${Date.now().toString(36)}`,
      courseId: selectedCourse.id,
      unitNumber: selectedUnitNumber,
      questions: activeQuestions,
      answers,
      ...stats,
      completedAt: new Date().toISOString(),
    };

    recordQuizAttempt(attempt);
    setFinishedAttempt(attempt);
    setActiveQuestions(null);
  };

  const handleNextOrFinish = () => {
    if (!activeQuestions) return;
    if (currentIdx < activeQuestions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      return;
    }
    finishActiveQuiz();
  };

  if (!hasRawText) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
          <HelpCircle className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
          Quiz İçin Önce Ünite İçeriği Gerekli
        </h3>
        <p className="mx-auto mt-1.5 max-w-md text-xs text-slate-500 dark:text-slate-400">
          Ünite İçeriği sekmesinden ders özetini yapıştır veya .pdf / .txt
          yükle; ardından 5 şıklı ve çeldiricili AÖF denemesi üretelim.
        </p>
        <button
          type="button"
          onClick={() => setActiveSubTab("upload")}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500"
        >
          Ünite İçeriğine Git
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Quiz Tamamlandı Ekranı + Toplu Cevap Anahtarı
  if (finishedAttempt) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Award className="h-7 w-7" />
            </div>
            <h3 className="mt-3 text-xl font-extrabold text-slate-900 dark:text-white">
              Quiz Tamamlandı!
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {selectedCourse.name} • Ünite {selectedUnitNumber} (Resmi AÖF 4
              Yanlış 1 Doğru Kuralı Uygulandı)
            </p>

            <div className="mt-6 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="rounded-xl bg-emerald-500/10 p-3">
                <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                  Doğru
                </div>
                <div className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {finishedAttempt.correctCount}
                </div>
              </div>
              <div className="rounded-xl bg-rose-500/10 p-3">
                <div className="text-[11px] font-medium text-rose-700 dark:text-rose-300">
                  Yanlış
                </div>
                <div className="mt-1 text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                  {finishedAttempt.wrongCount}
                </div>
              </div>
              <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
                <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Boş
                </div>
                <div className="mt-1 text-2xl font-extrabold text-slate-700 dark:text-slate-200">
                  {finishedAttempt.blankCount}
                </div>
              </div>
              <div className="rounded-xl bg-indigo-500/10 p-3">
                <div className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                  AÖF Net
                </div>
                <div className="mt-1 text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {finishedAttempt.netScore}
                </div>
              </div>
              <div className="col-span-2 rounded-xl bg-amber-500/10 p-3 sm:col-span-1">
                <div className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                  Tahmini Puan
                </div>
                <div className="mt-1 text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                  {finishedAttempt.estimatedPoints}
                </div>
              </div>
            </div>

            {finishedAttempt.wrongCount > 0 && (
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  Yanlış yaptığın{" "}
                  <strong>{finishedAttempt.wrongCount}</strong> soru{" "}
                  <strong>Yanlış Defterine</strong> (1., 3., 7. ve 14. gün
                  aralıklı tekrar takvimiyle) eklendi.
                </span>
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setFinishedAttempt(null);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <RotateCcw className="h-4 w-4" />
                Yeni Quiz Başlat
              </button>
              <button
                type="button"
                onClick={() => setActiveView("dashboard")}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Yanlış Defteri ve Panele Dön
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Kural 3.9 & 8: Cevap Anahtarı ve Gerekçeler ayrı bölümde */}
        <AnswerKeySection
          questions={finishedAttempt.questions}
          answers={finishedAttempt.answers}
        />
      </div>
    );
  }

  // Aktif Quiz Çözüm Ekranı
  if (activeQuestions && activeQuestions.length > 0) {
    const q = activeQuestions[currentIdx];
    const selectedChoice = answers[q.id];
    const isAnswered = Boolean(selectedChoice);
    const showFeedbackNow = revealMode === "immediate" && isAnswered;
    const answeredCount = activeQuestions.filter(
      (item) => answers[item.id] && answers[item.id] !== "BOS"
    ).length;
    const answeredSubset = activeQuestions.filter((item) => answers[item.id]);
    const liveStats = calculateAofNet(answeredSubset, answers);

    return (
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-xl bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
              Soru {currentIdx + 1} / {activeQuestions.length}
            </span>
            {revealMode === "immediate" && (
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {q.topic}
              </span>
            )}
            {quizAiMeta && (
              <span
                className={`rounded-lg px-2 py-1 text-[11px] font-medium ${
                  quizAiMeta.provider === "evren"
                    ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {quizAiMeta.provider === "evren"
                  ? `EVREN • ${quizAiMeta.model}`
                  : quizAiMeta.model}
                {quizAiMeta.fallbackFrom === "gemini" ? " (Yedek)" : ""}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {revealMode === "end" ? (
              <span className="rounded-lg bg-indigo-500/10 px-2.5 py-1 font-semibold text-indigo-600 dark:text-indigo-300">
                İşaretlenen: {answeredCount} / {activeQuestions.length}
              </span>
            ) : (
              <>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {liveStats.correctCount} Doğru
                </span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  {liveStats.wrongCount} Yanlış
                </span>
                <span className="font-semibold text-slate-500">
                  {liveStats.blankCount} Boş
                </span>
                <span className="rounded-lg bg-indigo-500/10 px-2.5 py-1 font-bold text-indigo-600 dark:text-indigo-300">
                  Anlık Net: {liveStats.netScore}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="whitespace-pre-line text-base font-semibold leading-relaxed text-slate-900 dark:text-white">
            {q.question}
          </p>

          {q.codeSnippet && (
            <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">
              <code>{q.codeSnippet}</code>
            </pre>
          )}

          <div className="mt-5 space-y-2.5">
            {q.options.map((opt) => {
              const isSelected = selectedChoice === opt.key;
              const isCorrectOption = opt.key === q.correctKey;

              let cardClasses =
                "border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-500/5 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-indigo-500/50";

              if (showFeedbackNow) {
                if (isCorrectOption) {
                  cardClasses =
                    "border-emerald-500 bg-emerald-500/10 dark:border-emerald-500/70 dark:bg-emerald-500/15";
                } else if (isSelected && !isCorrectOption) {
                  cardClasses =
                    "border-rose-500 bg-rose-500/10 dark:border-rose-500/70 dark:bg-rose-500/15";
                } else {
                  cardClasses =
                    "border-slate-200/70 bg-slate-50/50 opacity-85 dark:border-slate-800/70 dark:bg-slate-950/20";
                }
              } else if (isSelected) {
                cardClasses =
                  "border-indigo-600 bg-indigo-500/10 dark:border-indigo-500 dark:bg-indigo-500/15";
              }

              return (
                <button
                  key={opt.key}
                  type="button"
                  disabled={showFeedbackNow}
                  onClick={() => handleSelectAnswer(q.id, opt.key)}
                  className={`w-full rounded-xl border p-3.5 text-left transition ${cardClasses}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          showFeedbackNow && isCorrectOption
                            ? "bg-emerald-600 text-white"
                            : showFeedbackNow && isSelected && !isCorrectOption
                              ? "bg-rose-600 text-white"
                              : isSelected
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {opt.key}
                      </span>
                      <span className="text-sm text-slate-800 dark:text-slate-100">
                        {opt.text}
                      </span>
                    </div>

                    {showFeedbackNow && isCorrectOption && (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                    )}
                    {showFeedbackNow && isSelected && !isCorrectOption && (
                      <XCircle className="h-5 w-5 shrink-0 text-rose-500" />
                    )}
                  </div>

                  {showFeedbackNow && (
                    <div
                      className={`mt-2.5 border-t pt-2 text-xs leading-relaxed ${
                        isCorrectOption
                          ? "border-emerald-500/20 text-emerald-800 dark:text-emerald-200"
                          : "border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400"
                      }`}
                    >
                      <span className="font-semibold">
                        {isCorrectOption
                          ? "Neden Doğru:"
                          : "Neden Yanlış / Çeldirici:"}
                      </span>{" "}
                      {opt.explanation}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {showFeedbackNow && (
            <div
              className={`mt-4 rounded-xl border p-3.5 text-xs ${
                selectedChoice === q.correctKey
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                  : selectedChoice === "BOS"
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200"
                    : "border-rose-500/40 bg-rose-500/10 text-rose-900 dark:text-rose-200"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 font-bold">
                <span>
                  {selectedChoice === q.correctKey
                    ? `Doğru Cevap: ${q.correctKey} Şıkkı`
                    : selectedChoice === "BOS"
                      ? `Boş Bırakıldı — Doğru Cevap: ${q.correctKey} Şıkkı`
                      : `Yanlış Seçim (${selectedChoice}) — Doğru Cevap: ${q.correctKey} Şıkkı`}
                </span>
                {q.guideReference && (
                  <span className="text-[11px] font-semibold opacity-80">
                    Dayanak: {q.guideReference}
                  </span>
                )}
              </div>
              {(() => {
                const correctOpt = q.options.find(
                  (o) => o.key === q.correctKey
                );
                return correctOpt ? (
                  <p className="mt-1.5 leading-relaxed">
                    <strong>Açıklama:</strong> {correctOpt.explanation}
                  </p>
                ) : null;
              })()}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            {revealMode === "end" ? (
              <>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Önceki
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAnswer(q.id, "BOS")}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      selectedChoice === "BOS"
                        ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        : "border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    <MinusCircle className="h-4 w-4" />
                    Boş Bırak
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {currentIdx < activeQuestions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentIdx((p) => p + 1)}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500"
                    >
                      Sonraki Soru
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={finishActiveQuiz}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500"
                    >
                      Quizi Bitir & Cevap Anahtarını Gör
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </>
            ) : !isAnswered ? (
              <>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Emin değilsen AÖF stratejisi gereği soruyu boş bırakabilirsin.
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectAnswer(q.id, "BOS")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <MinusCircle className="h-4 w-4" />
                  Bu Soruyu Boş Bırak
                </button>
              </>
            ) : (
              <>
                <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500" />
                    <span>
                      <strong>Çeldirici Odağı:</strong> {q.distractorStrategy}
                    </span>
                  </div>
                  {q.guideReference && (
                    <div className="pl-6 text-[11px] text-indigo-600 dark:text-indigo-400">
                      <strong>Dayanak:</strong> {q.guideReference}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleNextOrFinish}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  {currentIdx < activeQuestions.length - 1
                    ? "Sonraki Soru"
                    : "Quizi Bitir ve Neti Hesapla"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Başlangıç / Kurulum Kartı + Anlamayı Ölçme + Geçmiş
  return (
    <div className="space-y-5">
      {/* Kural 4.3: Rehberi okumadan quiz'e gelen öğrenciye nazik hatırlatma */}
      {!hasGuide && (
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-indigo-500/25 bg-indigo-500/10 p-4 text-xs text-indigo-900 sm:flex-row sm:items-center dark:text-indigo-200">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-4 w-4 shrink-0 text-indigo-500" />
            <span>
              <strong>Ünitenin notlarına bir göz atmak ister misin?</strong>{" "}
              Önce Çalışma Rehberini incelemek hem daha yüksek net çıkarmanı
              sağlar hem de soruları rehberle %100 uyumlu hâle getirir.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveSubTab("guide")}
            className="inline-flex shrink-0 items-center gap-1 self-start rounded-xl bg-indigo-600 px-3.5 py-2 text-[11px] font-semibold text-white hover:bg-indigo-500 sm:self-auto"
          >
            Çalışma Rehberine Git
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Kural 5.3: Yanlış Defterinden Zayıf Konu Odağı */}
      {pendingWeakTopics.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-900 dark:text-amber-200">
          <span>
            <strong>Yanlış Defteri Tekrar Modu Aktif:</strong> Sorular ağırlıklı
            olarak şu zayıf konularından farklı biçimde sorulacak:{" "}
            <strong>{pendingWeakTopics.join(", ")}</strong>
          </span>
          <button
            type="button"
            onClick={clearPendingWeakTopics}
            className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold hover:bg-amber-500/30"
          >
            <X className="h-3 w-3" /> Temizle
          </button>
        </div>
      )}

      {/* Ana Quiz Kurulum Kartı */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400">
              <Sparkles className="h-3.5 w-3.5" />
              AÖF Sınav Simülasyonu • 5 Şıklı (A–E)
            </span>
            <h3 className="mt-2.5 text-lg font-bold text-slate-900 dark:text-white">
              Çoktan Seçmeli AÖF Quizi Başlat
            </h3>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Tamamı 5 şıklı (A–E) çoktan seçmeli sorularla (%30 kolay, %50
              orta, %20 zor) dengeli test üretilir; şıkkı seçtiğinde doğru
              cevap ve açıklaması anında görünür.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2.5 sm:items-end">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
              {([5, 10, 15, 20, 25] as const).map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    questionCount === cnt
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {cnt}
                </button>
              ))}
              <span className="self-center px-1.5 text-[11px] text-slate-400">
                Soru
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {hasGuide && (
                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setQuizScope("guide_aligned")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                      quizScope === "guide_aligned"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    Rehbere Uyumlu
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuizScope("full_text")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                      quizScope === "full_text"
                        ? "bg-slate-700 text-white shadow-xs dark:bg-slate-600"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    Tüm Ünite Metni
                  </button>
                </div>
              )}

              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setRevealMode("immediate")}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
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
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                    revealMode === "end"
                      ? "bg-slate-700 text-white shadow-xs dark:bg-slate-600"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  Cevaplar Sonda
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => void startQuiz()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {questionCount} Soruluk Quiz Hazırlanıyor...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  {questionCount} Soruluk AÖF Quizi Üret
                </>
              )}
            </button>
          </div>
        </div>

        {hasGuide && !hasDetailedGuide && (
          <div className="mt-4 flex flex-col justify-between gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-900 sm:flex-row sm:items-center dark:text-amber-200">
            <span>
              Mevcut Çalışma Rehberi eski/kısmi formatta; tüm başlıkların
              kapsanması için önce rehberi güncellemen önerilir.
            </span>
            <button
              type="button"
              onClick={() => setActiveSubTab("guide")}
              className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-500 sm:self-auto"
            >
              Çalışma Rehberine Git
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="mt-4 grid gap-2 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-600 sm:grid-cols-3 dark:bg-slate-800/50 dark:text-slate-300">
          <div>
            <strong>1. AÖF Formatı:</strong> 5 şıklı karma soru tipleri
          </div>
          <div>
            <strong>2. Resmi Net Kuralı:</strong> 4 yanlış 1 doğruyu götürür
          </div>
          <div>
            <strong>3. Cevap Anahtarı:</strong> Gerekçe + Ünite dayanağı
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {currentUnitRecord.quizHistory.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <History className="h-4 w-4 text-indigo-500" />
            Ünite {selectedUnitNumber} Quiz Geçmişi (
            {currentUnitRecord.quizHistory.length})
          </h4>
          <div className="mt-3 space-y-2">
            {currentUnitRecord.quizHistory.map((att) => (
              <div
                key={att.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/40"
              >
                <span className="text-slate-500 dark:text-slate-400">
                  {new Date(att.completedAt).toLocaleString("tr-TR")} •{" "}
                  {att.questions.length} Soru
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {att.correctCount}D
                  </span>
                  <span className="text-rose-600 dark:text-rose-400">
                    {att.wrongCount}Y
                  </span>
                  <span className="text-slate-500">{att.blankCount}B</span>
                  <span className="rounded-lg bg-indigo-500/10 px-2 py-0.5 font-bold text-indigo-600 dark:text-indigo-300">
                    {att.netScore} Net ({att.estimatedPoints} Puan)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
