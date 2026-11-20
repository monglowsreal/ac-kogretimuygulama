"use client";

import React, { useCallback, useEffect, useState } from "react";
import { GraduationCap, Menu, AlertTriangle, KeyRound } from "lucide-react";
import { DashboardView } from "@/components/DashboardView";
import { DesktopApiModal } from "@/components/DesktopApiModal";
import { MockExamView } from "@/components/MockExamView";
import { Sidebar } from "@/components/Sidebar";
import { UnitWorkspace } from "@/components/UnitWorkspace";
import { useCoach } from "@/context/CoachContext";
import { isLocalLoopbackHost } from "@/lib/storage";
import { AiHealthStatus } from "@/types/coach";

export default function HomePage() {
  const { activeView, hydrated, clientAiOverride } = useCoach();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiHealthStatus | null>(null);
  const [apiModalOpen, setApiModalOpen] = useState(false);

  const isDesktopApp =
    hydrated &&
    typeof window !== "undefined" &&
    Boolean(window.electronDesktop?.isDesktop);
  const canConfigureApiLocally =
    hydrated && (isDesktopApp || isLocalLoopbackHost());

  const refreshHealth = useCallback(() => {
    const reqInit: RequestInit = clientAiOverride
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientAiConfig: clientAiOverride }),
        }
      : { method: "GET" };

    fetch("/api/health", reqInit)
      .then((res) => res.json())
      .then((data: Partial<AiHealthStatus>) => {
        if (typeof data.configured === "boolean") {
          setAiStatus(data as AiHealthStatus);
        } else {
          setAiStatus(null);
        }
      })
      .catch(() => {
        setAiStatus({
          configured: false,
          geminiConfigured: false,
          evrenConfigured: false,
          model: "gemini-2.5-flash",
          geminiModel: "gemini-2.5-flash",
          evrenModel: "deepseek-v4.1-flash",
          preferredProvider: "auto",
          activeProvider: null,
        });
      });
  }, [clientAiOverride]);

  useEffect(() => {
    let active = true;
    const reqInit: RequestInit = clientAiOverride
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientAiConfig: clientAiOverride }),
        }
      : { method: "GET" };

    fetch("/api/health", reqInit)
      .then((res) => res.json())
      .then((data: Partial<AiHealthStatus>) => {
        if (active && typeof data.configured === "boolean") {
          setAiStatus(data as AiHealthStatus);
        }
      })
      .catch(() => {
        if (active) {
          setAiStatus({
            configured: false,
            geminiConfigured: false,
            evrenConfigured: false,
            model: "gemini-2.5-flash",
            geminiModel: "gemini-2.5-flash",
            evrenModel: "deepseek-v4.1-flash",
            preferredProvider: "auto",
            activeProvider: null,
          });
        }
      });
    return () => {
      active = false;
    };
  }, [clientAiOverride]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar
        aiStatus={aiStatus}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onOpenApiSettings={() => setApiModalOpen(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobil Üst Çubuk */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-md lg:hidden dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              AÖF Akıllı Koç
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-xl border border-slate-200 p-2 text-slate-700 dark:border-slate-700 dark:text-slate-200"
            aria-label="Menüyü aç"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* API Anahtarı Uyarı Şeridi */}
          {aiStatus?.configured === false && (
            <div className="mx-auto mb-5 flex max-w-6xl flex-col justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 sm:flex-row sm:items-center dark:text-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div>
                  <span className="font-bold">AI API Anahtarı Bekleniyor:</span>{" "}
                  {canConfigureApiLocally
                    ? "Gemini, OpenAI, Claude, Groq, OpenRouter, DeepSeek veya EVREN API anahtarınızdan dilediğinizi sağdaki butondan girin."
                    : "Kendi AI API anahtarını (Gemini, OpenAI, Claude, Groq vb.) sağdaki butondan girerek tarayıcında hemen kullanabilirsin."}
                </div>
              </div>
              {hydrated && (
                <button
                  type="button"
                  onClick={() => setApiModalOpen(true)}
                  className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-500 sm:self-auto"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  API Anahtarı Gir
                </button>
              )}
            </div>
          )}

          {!hydrated ? (
            <div className="mx-auto max-w-6xl space-y-4">
              <div className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="h-36 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-36 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ) : activeView === "dashboard" ? (
            <DashboardView />
          ) : activeView === "exam" ? (
            <MockExamView />
          ) : (
            <UnitWorkspace />
          )}
        </main>
      </div>

      <DesktopApiModal
        key={aiStatus?.evrenModel ?? "default"}
        open={apiModalOpen}
        aiStatus={aiStatus}
        onClose={() => setApiModalOpen(false)}
        onSaved={refreshHealth}
      />
    </div>
  );
}
