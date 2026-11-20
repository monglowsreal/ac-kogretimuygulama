import { AiProviderPreference } from "@/types/coach";

export interface DesktopApiSettingsPayload {
  geminiApiKey?: string;
  evrenApiKey?: string;
  evrenModel?: string;
  aiProvider?: AiProviderPreference;
  universalApiKey?: string;
  universalProvider?: AiProviderPreference;
  universalModel?: string;
  universalBaseUrl?: string;
}

export interface ElectronDesktopInfo {
  isDesktop: boolean;
  version: string;
  userDataPath: string;
  hasCustomApiKey: boolean;
  hasGeminiApiKey?: boolean;
  hasEvrenApiKey?: boolean;
  evrenModel?: string;
  aiProvider?: AiProviderPreference;
}

export interface ElectronDesktopBridge {
  isDesktop: boolean;
  platform: string;
  getInfo: () => Promise<ElectronDesktopInfo>;
  readState: () => Promise<string | null>;
  writeState: (stateJson: string) => Promise<boolean>;
  saveApiKey: (
    payload: string | DesktopApiSettingsPayload
  ) => Promise<{ ok: boolean; error?: string }>;
  openExternal: (url: string) => Promise<boolean>;
}

declare global {
  interface Window {
    electronDesktop?: ElectronDesktopBridge;
  }
}

export {};
