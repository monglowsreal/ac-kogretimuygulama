"use client";

import React from "react";
import { BookOpenCheck, CheckCircle2, MinusCircle, XCircle } from "lucide-react";
import { QuizOptionKey, QuizQuestion } from "@/types/coach";

interface AnswerKeySectionProps {
  questions: QuizQuestion[];
  answers: Record<string, QuizOptionKey | "BOS">;
  title?: string;
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  bilgi: "Doğrudan Bilgi",
  olumsuz: "Olumsuz Kök",
  oncul: "Öncüllü (I-II-III)",
  eslestirme: "Eşleştirme / Sıra",
  ayirt_etme: "Kavram Ayırt Etme",
};

export function AnswerKeySection({
  questions,
  answers,
  title = "Cevap Anahtarı ve Gerekçeler",
}: AnswerKeySectionProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2">
        <BookOpenCheck className="h-5 w-5 text-indigo-500" />
        <h4 className="text-base font-bold text-slate-900 dark:text-white">
          {title} ({questions.length} Soru)
        </h4>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => {
          const userAns = answers[q.id] ?? "BOS";
          const isBlank = userAns === "BOS";
          const isCorrect = !isBlank && userAns === q.correctKey;
          const correctOpt = q.options.find((o) => o.key === q.correctKey);
          const wrongOpts = q.options.filter((o) => o.key !== q.correctKey);

          return (
            <div
              key={q.id}
              className={`rounded-xl border p-4 ${
                isCorrect
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : isBlank
                    ? "border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/30"
                    : "border-rose-500/30 bg-rose-500/5"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-[11px] font-bold text-white">
                    Soru {idx + 1}
                  </span>
                  {q.unitNumber && (
                    <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Ünite {q.unitNumber}
                    </span>
                  )}
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {q.topic}
                  </span>
                  {q.questionType && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {QUESTION_TYPE_LABELS[q.questionType] || q.questionType}
                    </span>
                  )}
                  {q.difficulty && (
                    <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 uppercase dark:text-amber-300">
                      {q.difficulty}
                    </span>
                  )}
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    isCorrect
                      ? "bg-emerald-600 text-white"
                      : isBlank
                        ? "bg-slate-500 text-white"
                        : "bg-rose-600 text-white"
                  }`}
                >
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" /> Doğru ({q.correctKey})
                    </>
                  ) : isBlank ? (
                    <>
                      <MinusCircle className="h-3 w-3" /> Boş • Doğru: {q.correctKey}
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" /> Yanlış ({userAns}) • Doğru: {q.correctKey}
                    </>
                  )}
                </span>
              </div>

              <p className="mt-2 text-xs font-medium leading-relaxed text-slate-800 dark:text-slate-100">
                {q.question}
              </p>

              {correctOpt && (
                <div className="mt-2.5 rounded-lg bg-emerald-500/10 p-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                  <strong>
                    Doğru Şık ({correctOpt.key}): {correctOpt.text}
                  </strong>
                  <p className="mt-0.5 leading-relaxed">{correctOpt.explanation}</p>
                </div>
              )}

              {q.guideReference && (
                <p className="mt-2 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                  <strong>Dayanak:</strong> {q.guideReference}
                </p>
              )}

              <div className="mt-2.5 grid gap-1.5 text-[11px] text-slate-600 sm:grid-cols-2 dark:text-slate-400">
                {wrongOpts.map((opt) => (
                  <div
                    key={opt.key}
                    className="rounded-lg bg-white/60 px-2.5 py-1.5 dark:bg-slate-900/50"
                  >
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {opt.key}) {opt.text}:
                    </span>{" "}
                    {opt.explanation}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
