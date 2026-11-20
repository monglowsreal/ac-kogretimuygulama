"use client";

import React, { useState } from "react";
import {
  KeyRound,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCoach } from "@/context/CoachContext";
import { EVREN_CHAT_MODELS } from "@/data/evren-models";
import {
  AI_PROVIDER_PRESETS,
  detectProviderFromKey,
  getProviderPreset,
} from "@/lib/ai-providers";
import { isLocalLoopbackHost } from "@/lib/storage";
import {
  AiHealthStatus,
  AiProviderId,
  AiProviderPreference,
} from "@/types/coach";

interface DesktopApiModalProps {
  open: boolean;
  aiStatus: AiHealthStatus | null;
  onClose: () => void;
  onSaved: () => void;
}

export function DesktopApiModal({
  open,
  aiStatus,
  onClose,
  onSaved,
}: DesktopApiModalProps) {
  const { clientAiOverride, setClientAiOverride, setAiPreference } = useCoach();

  const [universalKey, setUniversalKey] = useState(
    clientAiOverride?.apiKey || ""
  );
  const [selectedProvider, setSelectedProvider] = useState<
    "auto" | AiProviderId
  >(clientAiOverride?.provider || "auto");
  const [modelInput, setModelInput] = useState(clientAiOverride?.model || "");
  const [baseUrlInput, setBaseUrlInput] = useState(
    clientAiOverride?.baseUrl || ""
  );
  const [aiMode, setAiMode] = useState<AiProviderPreference>(
    aiStatus?.preferredProvider || "auto"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const detected = detectProviderFromKey(universalKey);
  const effectiveProvider: AiProviderId =
    selectedProvider === "auto" ? detected.provider : selectedProvider;
  const activePreset = getProviderPreset(effectiveProvider);
  const isOllama = effectiveProvider === "ollama";
  const needsBaseUrl =
    effectiveProvider === "custom" || effectiveProvider === "ollama";

  const isElectron =
    typeof window !== "undefined" && Boolean(window.electronDesktop?.saveApiKey);
  const isLocalServer = isElectron || isLocalLoopbackHost();

  const canSubmit =
    universalKey.trim().length >= 4 ||
    isOllama ||
    Boolean(aiStatus?.configured);

  const handleProviderChange = (nextVal: "auto" | AiProviderId) => {
    setSelectedProvider(nextVal);
    if (nextVal !== "auto") {
      const p = getProviderPreset(nextVal);
      setModelInput(p.defaultModel);
      setBaseUrlInput(p.defaultBaseUrl);
    } else {
      setModelInput("");
      setBaseUrlInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const trimmedKey = universalKey.trim();
    const resolvedModel = modelInput.trim() || activePreset.defaultModel;
    const resolvedBaseUrl =
      baseUrlInput.trim() || activePreset.defaultBaseUrl;

    try {
      if (isElectron && window.electronDesktop?.saveApiKey) {
        const res = await window.electronDesktop.saveApiKey({
          universalApiKey: trimmedKey || undefined,
          universalProvider: selectedProvider,
          universalModel: resolvedModel,
          universalBaseUrl: resolvedBaseUrl || undefined,
          aiProvider: aiMode,
        });
        if (!res.ok) {
          throw new Error(res.error || "API ayarları kaydedilemedi.");
        }
      } else if (isLocalLoopbackHost()) {
        const res = await fetch("/api/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            universalApiKey: trimmedKey || undefined,
            universalProvider: selectedProvider,
            universalModel: resolvedModel,
            universalBaseUrl: resolvedBaseUrl || undefined,
            aiProvider: aiMode,
          }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "API ayarları kaydedilemedi.");
        }
        if (trimmedKey || isOllama) {
          setAiPreference(effectiveProvider);
        }
      } else {
        // Bulut/Web ortamında anahtarı yalnızca kullanıcının kendi tarayıcısında sakla
        if (trimmedKey || isOllama) {
          setClientAiOverride({
            provider: effectiveProvider,
            apiKey: trimmedKey,
            baseUrl: resolvedBaseUrl || undefined,
            model: resolvedModel,
          });
          setAiPreference(effectiveProvider);
        }
      }

      setUniversalKey("");
      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kaydetme sırasında hata oluştu."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClearBrowserKey = () => {
    setClientAiOverride(null);
    setUniversalKey("");
    setAiPreference("auto");
    onSaved();
    onClose();
  };

  const registeredList = aiStatus?.availableProviders ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Evrensel AI &amp; API Anahtarı Ayarları
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isLocalServer
                  ? "Gemini, OpenAI, Claude, Groq, OpenRouter, DeepSeek, Grok, EVREN veya Ollama anahtarlarından dilediğini gir."
                  : "Anahtarın yalnızca kendi tarayıcında tutulur, sunucuya kaydedilmez."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {registeredList.length > 0 && (
          <div className="mt-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-[11px] text-emerald-800 dark:text-emerald-200">
            <strong>Kayıtlı Sağlayıcılar:</strong>{" "}
            {registeredList.map((p) => `${p.label} (${p.model})`).join(" • ")}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                API Anahtarını Yapıştır
              </label>
              {universalKey.trim() && (
                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-300">
                  <Sparkles className="h-3 w-3" />
                  {activePreset.shortLabel}
                </span>
              )}
            </div>
            <input
              type="password"
              value={universalKey}
              disabled={isOllama}
              onChange={(e) => setUniversalKey(e.target.value)}
              placeholder={
                isOllama
                  ? "Yerel Ollama için anahtar gerekmez"
                  : "AIza..., sk-..., sk-ant-..., gsk_..., sk-or-..., evren_llm_..."
              }
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            {universalKey.trim() && detected.hint && selectedProvider === "auto" && (
              <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                {detected.hint}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Sağlayıcı
              </label>
              <select
                value={selectedProvider}
                onChange={(e) =>
                  handleProviderChange(e.target.value as "auto" | AiProviderId)
                }
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="auto">
                  Otomatik Algıla ({activePreset.shortLabel})
                </option>
                {AI_PROVIDER_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Model Adı
              </label>
              {effectiveProvider === "evren" ? (
                <select
                  value={modelInput || activePreset.defaultModel}
                  onChange={(e) => setModelInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {EVREN_CHAT_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={modelInput}
                  onChange={(e) => setModelInput(e.target.value)}
                  placeholder={activePreset.defaultModel}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              )}
            </div>
          </div>

          {needsBaseUrl && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                API Base URL (OpenAI /v1 uyumlu)
              </label>
              <input
                type="text"
                value={baseUrlInput}
                onChange={(e) => setBaseUrlInput(e.target.value)}
                placeholder={
                  isOllama
                    ? "http://127.0.0.1:11434/v1"
                    : "https://api.example.com/v1"
                }
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          )}

          {isLocalServer && registeredList.length > 1 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Varsayılan Çalışma Sırası
              </label>
              <select
                value={aiMode}
                onChange={(e) =>
                  setAiMode(e.target.value as AiProviderPreference)
                }
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="auto">Otomatik (Öncelikli → Yedek)</option>
                {registeredList.map((p) => (
                  <option key={p.id} value={p.id}>
                    Öncelik: {p.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Ücretsiz / Popüler Anahtar Linkleri */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <span className="font-semibold">Anahtar Al:</span>
            {AI_PROVIDER_PRESETS.filter((p) => p.keyHelpUrl)
              .slice(0, 6)
              .map((p) => (
                <a
                  key={p.id}
                  href={p.keyHelpUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400"
                >
                  {p.shortLabel}
                </a>
              ))}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div>
              {clientAiOverride && (
                <button
                  type="button"
                  onClick={handleClearBrowserKey}
                  className="inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Tarayıcı Anahtarını Sil
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={saving || !canSubmit}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Uygulanıyor...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Kaydet ve Uygula
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
