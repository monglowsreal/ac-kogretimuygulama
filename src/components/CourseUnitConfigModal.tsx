"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useCoach } from "@/context/CoachContext";
import {
  buildUnitRange,
  formatUnitRangeLabel,
  getCourseUnitConfig,
  getDefaultVizeUnits,
  MAX_COURSE_UNITS,
  MIN_COURSE_UNITS,
  resizeCourseUnitDraft,
} from "@/lib/course-units";
import { Course } from "@/types/coach";

export interface CourseUnitDraft {
  totalUnits: number;
  vizeUnits: number[];
  finalUnits: number[];
}

export function createDefaultUnitDraft(
  course?: Pick<Course, "totalUnits" | "vizeUnits" | "finalUnits"> | null
): CourseUnitDraft {
  const cfg = getCourseUnitConfig(course);
  return {
    totalUnits: cfg.totalUnits,
    vizeUnits: cfg.vizeUnits,
    finalUnits: cfg.finalUnits,
  };
}

interface UnitSelectionGroupProps {
  title: string;
  rangeLabel: string;
  totalUnits: number;
  selectedUnits: number[];
  accent: "amber" | "indigo";
  compact?: boolean;
  actions: { label: string; onClick: () => void }[];
  onToggleUnit: (unitNumber: number) => void;
}

function UnitSelectionGroup({
  title,
  rangeLabel,
  totalUnits,
  selectedUnits,
  accent,
  compact = false,
  actions,
  onToggleUnit,
}: UnitSelectionGroupProps) {
  const selectedSet = new Set(selectedUnits);
  const unitNumbers = buildUnitRange(1, totalUnits);

  const activeBtnCls =
    accent === "amber"
      ? "border-amber-500 bg-amber-500 text-white shadow-xs"
      : "border-indigo-600 bg-indigo-600 text-white shadow-xs";
  const badgeCls =
    accent === "amber"
      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
      : "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300";

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 dark:border-slate-700/80 dark:bg-slate-800/40">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
            {title}
          </span>
          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${badgeCls}`}>
            {rangeLabel}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {actions.map((act) => (
            <button
              key={act.label}
              type="button"
              onClick={act.onClick}
              className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"
            >
              {act.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`grid gap-1 ${
          compact ? "grid-cols-4" : "grid-cols-6 sm:grid-cols-8"
        }`}
      >
        {unitNumbers.map((unitNum) => {
          const isSelected = selectedSet.has(unitNum);
          return (
            <button
              key={unitNum}
              type="button"
              onClick={() => onToggleUnit(unitNum)}
              className={`flex items-center justify-center gap-0.5 rounded-lg border py-1 text-[11px] font-semibold transition ${
                isSelected
                  ? activeBtnCls
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {unitNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface CourseUnitScopeFieldsProps {
  value: CourseUnitDraft;
  onChange: (next: CourseUnitDraft) => void;
  compact?: boolean;
}

const PRESET_UNIT_COUNTS = [6, 8, 10, 12, 14] as const;

export function CourseUnitScopeFields({
  value,
  onChange,
  compact = false,
}: CourseUnitScopeFieldsProps) {
  const [expanded, setExpanded] = useState(!compact);

  const vizeLabel = formatUnitRangeLabel(value.vizeUnits);
  const finalLabel = formatUnitRangeLabel(value.finalUnits);

  const handleTotalChange = (nextCount: number) => {
    onChange(resizeCourseUnitDraft(value, nextCount));
  };

  const toggleInField = (field: "vizeUnits" | "finalUnits", unitNum: number) => {
    const current = value[field];
    const next = current.includes(unitNum)
      ? current.filter((u) => u !== unitNum)
      : [...current, unitNum].sort((a, b) => a - b);
    onChange({ ...value, [field]: next });
  };

  const applyCumulativeTemplate = () => {
    onChange({
      totalUnits: value.totalUnits,
      vizeUnits: getDefaultVizeUnits(value.totalUnits),
      finalUnits: buildUnitRange(1, value.totalUnits),
    });
  };

  const applySplitTemplate = () => {
    const firstHalf = getDefaultVizeUnits(value.totalUnits);
    const lastVize = firstHalf[firstHalf.length - 1] ?? 0;
    onChange({
      totalUnits: value.totalUnits,
      vizeUnits: firstHalf,
      finalUnits: buildUnitRange(lastVize + 1, value.totalUnits),
    });
  };

  const applyNonVizeToFinal = () => {
    const vizeSet = new Set(value.vizeUnits);
    const remaining = buildUnitRange(1, value.totalUnits).filter(
      (u) => !vizeSet.has(u)
    );
    onChange({ ...value, finalUnits: remaining });
  };

  return (
    <div className="space-y-2.5">
      {/* Ünite Sayısı Kontrolü */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
          Toplam Ünite Sayısı
        </label>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={value.totalUnits <= MIN_COURSE_UNITS}
            onClick={() => handleTotalChange(value.totalUnits - 1)}
            aria-label="Ünite sayısını azalt"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <input
            type="number"
            min={MIN_COURSE_UNITS}
            max={MAX_COURSE_UNITS}
            value={value.totalUnits}
            onChange={(e) => {
              const parsed = Number.parseInt(e.target.value, 10);
              if (!Number.isNaN(parsed)) {
                handleTotalChange(parsed);
              }
            }}
            className="h-7 w-12 rounded-lg border border-slate-300 bg-white text-center text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
          <button
            type="button"
            disabled={value.totalUnits >= MAX_COURSE_UNITS}
            onClick={() => handleTotalChange(value.totalUnits + 1)}
            aria-label="Ünite sayısını artır"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!compact && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Hızlı seç:</span>
          {PRESET_UNIT_COUNTS.map((cnt) => (
            <button
              key={cnt}
              type="button"
              onClick={() => handleTotalChange(cnt)}
              className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold transition ${
                value.totalUnits === cnt
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {cnt} Ünite
            </button>
          ))}
        </div>
      )}

      {compact && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white/80 px-2.5 py-1.5 text-left text-[11px] text-slate-600 transition hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-900"
        >
          <span className="truncate">
            <strong className="text-amber-600 dark:text-amber-400">
              Vize: {vizeLabel}
            </strong>{" "}
            •{" "}
            <strong className="text-indigo-600 dark:text-indigo-400">
              Final: {finalLabel}
            </strong>
          </span>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          )}
        </button>
      )}

      {expanded && (
        <div className="space-y-2.5">
          {/* Hızlı Vize / Final Şablonları */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={applyCumulativeTemplate}
              className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              İlk Yarı Vize • Tümü Final
            </button>
            <button
              type="button"
              onClick={applySplitTemplate}
              className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              İlk Yarı Vize • Kalanı Final
            </button>
          </div>

          <UnitSelectionGroup
            title="Vize'de Çıkacak Üniteler"
            rangeLabel={vizeLabel}
            totalUnits={value.totalUnits}
            selectedUnits={value.vizeUnits}
            accent="amber"
            compact={compact}
            onToggleUnit={(u) => toggleInField("vizeUnits", u)}
            actions={[
              {
                label: "İlk Yarı",
                onClick: () =>
                  onChange({
                    ...value,
                    vizeUnits: getDefaultVizeUnits(value.totalUnits),
                  }),
              },
              {
                label: "Tümü",
                onClick: () =>
                  onChange({
                    ...value,
                    vizeUnits: buildUnitRange(1, value.totalUnits),
                  }),
              },
              {
                label: "Temizle",
                onClick: () => onChange({ ...value, vizeUnits: [] }),
              },
            ]}
          />

          <UnitSelectionGroup
            title="Final'de Çıkacak Üniteler"
            rangeLabel={finalLabel}
            totalUnits={value.totalUnits}
            selectedUnits={value.finalUnits}
            accent="indigo"
            compact={compact}
            onToggleUnit={(u) => toggleInField("finalUnits", u)}
            actions={[
              {
                label: "Tümü",
                onClick: () =>
                  onChange({
                    ...value,
                    finalUnits: buildUnitRange(1, value.totalUnits),
                  }),
              },
              {
                label: "Vize Dışındakiler",
                onClick: applyNonVizeToFinal,
              },
              {
                label: "Temizle",
                onClick: () => onChange({ ...value, finalUnits: [] }),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}

interface CourseUnitConfigModalProps {
  course: Course;
  onClose: () => void;
}

export function CourseUnitConfigModal({
  course,
  onClose,
}: CourseUnitConfigModalProps) {
  const { updateCourseUnitConfig } = useCoach();
  const [draft, setDraft] = useState<CourseUnitDraft>(() =>
    createDefaultUnitDraft(course)
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCourseUnitConfig(course.id, draft);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <form
        onSubmit={handleSave}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Ünite Sayısı ve Vize / Final Kapsamı
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {course.name} ({course.code})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 max-h-[70vh] overflow-y-auto pr-1">
          <CourseUnitScopeFields value={draft} onChange={setDraft} />
          <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
            Not: Ünite sayısını düşürürsen daha önce yüklediğin üst ünite
            notların silinmez; sadece ders görünümü ve ilerleme hesaplaması yeni
            ünite sayına göre güncellenir.
          </p>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            İptal
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
          >
            <Check className="h-3.5 w-3.5" />
            Ayarları Kaydet
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
