import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { DEFAULT_API_BASE_URL, getSettings, saveSettings } from "./lib/settings";
import "./style.css";

function Popup() {
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [connected, setConnected] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const settings = await getSettings();
      if (settings.apiBaseUrl) setApiBaseUrl(settings.apiBaseUrl);
      setConnected(Boolean(settings.accessToken));

      const response = await chrome.runtime.sendMessage({ type: "GET_CONNECTION_STATUS" }).catch(() => null);
      if (response?.connected) setConnected(true);
    }

    void load();
  }, []);

  async function connect() {
    await saveSettings({ apiBaseUrl });
    const response = await chrome.runtime.sendMessage({ type: "GET_CONNECTION_STATUS" }).catch(() => null);

    if (response?.connected) {
      setConnected(true);
      setMessage("Connected.");
      return;
    }

    await chrome.tabs.create({ url: `${apiBaseUrl.replace(/\/$/, "")}/extension/connect` });
    setMessage("Sign in, then reopen the extension.");
  }

  async function disconnect() {
    await chrome.storage.sync.remove("accessToken");
    setConnected(false);
    setMessage("Disconnected.");
  }

  async function saveCurrentJob() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;

    const response = await chrome.tabs.sendMessage(tab.id, { type: "SAVE_CURRENT_JOB" }).catch(() => null);
    if (response?.ok) {
      setMessage("Saved current job.");
    } else {
      setMessage(response?.error ?? "Open a supported job page first.");
    }
  }

  async function saveAdvanced(event: React.FormEvent) {
    event.preventDefault();
    await saveSettings({ apiBaseUrl });
    setMessage("Saved.");
  }

  return (
    <main className="rtai-popup">
      <h1>ResumeTracker AI</h1>
      <p>{connected ? "Ready to save jobs to your dashboard." : "Connect your dashboard account once to start saving jobs."}</p>

      <div className={`rtai-status ${connected ? "rtai-status-connected" : ""}`}>
        <span />
        {connected ? "Connected" : "Not connected"}
      </div>

      <div className="rtai-actions">
        {connected ? (
          <>
            <button type="button" onClick={saveCurrentJob}>Save current job</button>
            <button type="button" className="rtai-secondary" onClick={disconnect}>Disconnect</button>
          </>
        ) : (
          <>
            <button type="button" onClick={saveCurrentJob}>Save current job</button>
            <button type="button" className="rtai-secondary" onClick={connect}>Connect ResumeTracker</button>
          </>
        )}
      </div>

      <button type="button" className="rtai-link" onClick={() => setShowAdvanced((value) => !value)}>
        Advanced settings
      </button>

      {showAdvanced && (
        <form onSubmit={saveAdvanced}>
          <label>
            Dashboard URL
            <input value={apiBaseUrl} onChange={(event) => setApiBaseUrl(event.target.value)} />
          </label>
          <button>Save dashboard URL</button>
        </form>
      )}
      {message && <span>{message}</span>}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Popup />);
