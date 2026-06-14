import { ExtensionSettings } from "./types";

export const DEFAULT_API_BASE_URL = "http://localhost:3000";

export async function getSettings(): Promise<ExtensionSettings> {
  return chrome.storage.sync.get(["apiBaseUrl", "accessToken"]);
}

export async function saveSettings(settings: ExtensionSettings) {
  await chrome.storage.sync.set(settings);
}
