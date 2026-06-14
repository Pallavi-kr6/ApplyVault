import { ExtractedJobData } from "./lib/types";
import { DEFAULT_API_BASE_URL, getSettings } from "./lib/settings";

function normalizeApiBaseUrl(apiBaseUrl?: string) {
  return (apiBaseUrl || DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

async function getAccessToken() {
  const settings = await getSettings();
  if (settings.accessToken) return settings.accessToken;

  const apiBaseUrl = normalizeApiBaseUrl(settings.apiBaseUrl);
  const response = await fetch(`${apiBaseUrl}/api/auth/extension-token`, {
    method: "GET",
    credentials: "include"
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as { token?: string };
  if (!payload.token) return null;

  await chrome.storage.sync.set({
    apiBaseUrl,
    accessToken: payload.token
  });

  return payload.token;
}

async function saveJob(job: ExtractedJobData) {
  const settings = await getSettings();
  const apiBaseUrl = normalizeApiBaseUrl(settings.apiBaseUrl);
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error("Sign in to ResumeTracker first.");
  }

  const response = await fetch(`${apiBaseUrl}/api/applications`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(job)
  });

  if (!response.ok) {
    if (response.status === 401) {
      await chrome.storage.sync.remove("accessToken");
      throw new Error("Please reconnect ResumeTracker.");
    }

    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Save failed");
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["apiBaseUrl"], (settings) => {
    if (!settings.apiBaseUrl) {
      chrome.storage.sync.set({ apiBaseUrl: DEFAULT_API_BASE_URL });
    }
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "GET_CONNECTION_STATUS") {
    getAccessToken()
      .then((token) => sendResponse({ connected: Boolean(token) }))
      .catch(() => sendResponse({ connected: false }));
    return true;
  }

  if (message?.type === "SAVE_JOB") {
    saveJob(message.job)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "Save failed" }));
    return true;
  }

  return false;
});
