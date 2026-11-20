import { isValidAiProviderId } from "@/lib/ai-providers";
import {
  AiProviderPreference,
  ClientAiOverride,
  CoachState,
} from "@/types/coach";

const STORAGE_KEY = "aof_akilli_koc_state_v1";
const THEME_STORAGE_KEY = "aof_akilli_koc_theme_v1";
const AI_PREF_STORAGE_KEY = "aof_akilli_koc_ai_pref_v1";
const EVREN_MODEL_STORAGE_KEY = "aof_akilli_koc_evren_model_v1";
const CLIENT_AI_OVERRIDE_KEY = "aof_akilli_koc_client_ai_v1";

export type ThemeMode = "light" | "dark";

export function isLocalLoopbackHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

export function getInitialCoachState(): CoachState {
  return {
    courses: [],
    units: {},
    reviewItems: [],
    examDates: {
      vizeDate: "2026-12-05",
      finalDate: "2027-01-16",
    },
  };
}

export function parseCoachStateJson(raw: string): CoachState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<CoachState>;
    const initial = getInitialCoachState();

    return {
      courses: Array.isArray(parsed.courses)
        ? parsed.courses
        : initial.courses,
      units: parsed.units && typeof parsed.units === "object" ? parsed.units : {},
      reviewItems: Array.isArray(parsed.reviewItems) ? parsed.reviewItems : [],
      examDates:
        parsed.examDates?.vizeDate && parsed.examDates?.finalDate
          ? parsed.examDates
          : initial.examDates,
    };
  } catch {
    return null;
  }
}

export function loadCoachState(): CoachState {
  if (typeof window === "undefined") {
    return getInitialCoachState();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialCoachState();
    return parseCoachStateJson(raw) ?? getInitialCoachState();
  } catch {
    return getInitialCoachState();
  }
}

export function saveCoachStateLocalOnly(
  state: CoachState,
  preSerialized?: string
): void {
  if (typeof window === "undefined") return;
  const serialized = preSerialized ?? JSON.stringify(state);

  try {
    window.localStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    // Tarayıcı localStorage (~5 MB) kotası tam ünite metinleriyle dolarsa,
    // ham metinleri kırparak rehber, quiz geçmişi ve ilerleme durumunu koru
    try {
      const compactUnits: CoachState["units"] = {};
      for (const [k, unit] of Object.entries(state.units)) {
        compactUnits[k] = {
          ...unit,
          rawText: unit.rawText.slice(0, 4000),
        };
      }
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...state, units: compactUnits })
      );
    } catch {
      // Yine aşılırsa sessizce yoksay
    }
  }
}

export function saveCoachState(state: CoachState): void {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(state);

  // Masaüstü uygulamasında tam veriyi (tam ünite PDF metinleri dahil) AppData dosyasına yaz
  if (window.electronDesktop?.isDesktop) {
    void window.electronDesktop.writeState(serialized);
  } else if (isLocalLoopbackHost()) {
    // Yerel masaüstü/localhost sunucusunda AppData/coach-data.json dosyasına senkronize et
    void fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw: serialized }),
    }).catch(() => {
      // Sunucu geçici erişilemezse localStorage yedeği zaten aşağıda yazılır
    });
  }

  saveCoachStateLocalOnly(state, serialized);
}

export function loadThemePreference(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "dark";
  }
}

export function saveThemePreference(theme: ThemeMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Yoksay
  }
}

export function loadAiPreference(): AiProviderPreference {
  if (typeof window === "undefined") return "auto";
  try {
    const saved = window.localStorage.getItem(AI_PREF_STORAGE_KEY);
    if (saved === "auto" || isValidAiProviderId(saved)) {
      return saved;
    }
  } catch {
    // Yoksay
  }
  return "auto";
}

export function saveAiPreference(pref: AiProviderPreference): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AI_PREF_STORAGE_KEY, pref);
  } catch {
    // Yoksay
  }
}

export function loadClientAiOverride(): ClientAiOverride | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(CLIENT_AI_OVERRIDE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as ClientAiOverride;
    if (!parsed || typeof parsed !== "object") return undefined;
    if (!parsed.apiKey?.trim() && parsed.provider !== "ollama") return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export function saveClientAiOverride(cfg: ClientAiOverride | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!cfg || (!cfg.apiKey?.trim() && cfg.provider !== "ollama")) {
      window.localStorage.removeItem(CLIENT_AI_OVERRIDE_KEY);
      return;
    }
    window.localStorage.setItem(CLIENT_AI_OVERRIDE_KEY, JSON.stringify(cfg));
  } catch {
    // Yoksay
  }
}

export function loadEvrenModelPreference(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(EVREN_MODEL_STORAGE_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function saveEvrenModelPreference(model: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(EVREN_MODEL_STORAGE_KEY, model.trim());
  } catch {
    // Yoksay
  }
}
