import { getExtractor } from "./extractors";
import "./style.css";

let saveInProgress = false;

function showToast(message: string, error = false) {
  const toast = document.createElement("div");
  toast.className = `rtai-toast ${error ? "rtai-toast-error" : ""}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3000);
}

async function saveJob() {
  if (saveInProgress) throw new Error("Save already in progress");
  const extractor = getExtractor();

  if (!extractor) {
    throw new Error("Unsupported job board");
  }

  saveInProgress = true;
  try {
    const job = extractor.extractJobData();
    const response = await chrome.runtime.sendMessage({ type: "SAVE_JOB", job });
    if (!response?.ok) throw new Error(response?.error ?? "Save failed");
    showToast("Job saved successfully");
  } finally {
    saveInProgress = false;
  }
}

async function connectDashboardSession() {
  try {
    const response = await fetch(`${window.location.origin}/api/auth/extension-token`, {
      method: "GET",
      credentials: "include"
    });

    if (!response.ok) throw new Error("Sign in to ResumeTracker first.");

    const payload = (await response.json()) as { token?: string };
    if (!payload.token) throw new Error("Could not connect extension.");

    await chrome.storage.sync.set({
      apiBaseUrl: window.location.origin,
      accessToken: payload.token
    });
    showToast("ResumeTracker extension connected");
  } catch (error) {
    showToast(error instanceof Error ? error.message : "Connection failed", true);
  }
}

async function saveJobWithToast() {
  try {
    await saveJob();
  } catch (error) {
    showToast(error instanceof Error ? error.message : "Save failed", true);
  }
}

function installFloatingButton() {
  if (document.getElementById("rtai-save-button")) return;
  const extractor = getExtractor();
  if (!extractor) return;

  const button = document.createElement("button");
  button.id = "rtai-save-button";
  button.textContent = "Save job";
  button.addEventListener("click", saveJobWithToast);
  document.body.appendChild(button);
}

function installApplyListener() {
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest("button,a");
    const label = button?.textContent?.toLowerCase() ?? "";
    if (label.includes("apply")) {
      void saveJobWithToast();
    }
  }, true);
}

if (window.location.pathname === "/extension/connect") {
  void connectDashboardSession();
} else {
  installFloatingButton();
  installApplyListener();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "SAVE_CURRENT_JOB") return false;

  saveJob()
    .then(() => sendResponse({ ok: true }))
    .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "Save failed" }));

  return true;
});
