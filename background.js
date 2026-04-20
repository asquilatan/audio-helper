const DEFAULT_STATE = {
  volumePercent: 100,
  bassBoostDb: 0,
  voiceBoostDb: 0,
  trebleBoostDb: 0,
  mono: false,
  limiter: false
};

const sessions = new Map();

async function ensureOffscreenDocument() {
  if (!chrome.offscreen) {
    throw new Error("Offscreen API is unavailable in this Chrome version.");
  }

  const offscreenUrl = chrome.runtime.getURL("offscreen.html");
  if (chrome.runtime.getContexts) {
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: [offscreenUrl]
    });
    if (existingContexts.length > 0) {
      return;
    }
  }

  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["AUDIO_PLAYBACK"],
    justification: "Process captured tab audio with Web Audio effects."
  });
}

function sendToOffscreen(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ target: "offscreen", ...message }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response || !response.ok) {
        reject(new Error(response?.error || "Offscreen command failed."));
        return;
      }
      resolve(response);
    });
  });
}

async function ensureSession(tabId) {
  const existing = sessions.get(tabId);
  if (existing?.active) {
    return existing;
  }

  await ensureOffscreenDocument();
  const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
  const state = existing?.state ? { ...existing.state } : { ...DEFAULT_STATE };

  await sendToOffscreen({
    type: "offscreen:start",
    tabId,
    streamId,
    state
  });

  const session = { active: true, state };
  sessions.set(tabId, session);
  return session;
}

async function setState(tabId, partialState) {
  const session = await ensureSession(tabId);
  session.state = { ...session.state, ...partialState };
  sessions.set(tabId, session);

  await sendToOffscreen({
    type: "offscreen:updateState",
    tabId,
    state: session.state
  });

  return session.state;
}

async function resetState(tabId) {
  const session = await ensureSession(tabId);
  session.state = { ...DEFAULT_STATE };
  sessions.set(tabId, session);

  await sendToOffscreen({
    type: "offscreen:updateState",
    tabId,
    state: session.state
  });

  return session.state;
}

async function stopSession(tabId) {
  if (!sessions.has(tabId)) {
    return;
  }

  try {
    await sendToOffscreen({ type: "offscreen:stop", tabId });
  } catch (_error) {
    // Ignore cleanup races when offscreen context is already gone.
  }

  sessions.delete(tabId);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || !message.type) {
    return;
  }

  const { tabId } = message;
  if (typeof tabId !== "number") {
    sendResponse({ ok: false, error: "No active tab id provided." });
    return;
  }

  (async () => {
    try {
      if (message.type === "audio:getState") {
        const session = await ensureSession(tabId);
        sendResponse({ ok: true, state: session.state });
        return;
      }

      if (message.type === "audio:setState") {
        const nextState = await setState(tabId, message.partialState || {});
        sendResponse({ ok: true, state: nextState });
        return;
      }

      if (message.type === "audio:reset") {
        const nextState = await resetState(tabId);
        sendResponse({ ok: true, state: nextState });
        return;
      }

      sendResponse({ ok: false, error: "Unknown message type." });
    } catch (error) {
      sendResponse({ ok: false, error: error.message || "Audio pipeline error." });
    }
  })();

  return true;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  stopSession(tabId);
});
