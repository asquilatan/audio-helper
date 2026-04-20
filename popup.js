const state = {
  volumePercent: 100,
  bassBoostDb: 0,
  voiceBoostDb: 0,
  trebleBoostDb: 0,
  mono: false,
  limiter: false
};

let activeTabId = null;
let initializedBackend = false;

function setStatus(text) {
  const statusEl = document.getElementById("status");
  statusEl.textContent = text;
}

function statusFromResponse(response, okText) {
  if (response.warning) {
    setStatus(response.warning);
    return;
  }
  setStatus(okText);
}

function updateSliderBackground(el) {
  const min = parseFloat(el.min) || 0;
  const max = parseFloat(el.max) || 100;
  const val = parseFloat(el.value);
  const percentage = ((val - min) / (max - min)) * 100;
  el.style.setProperty('--slider-bg', `linear-gradient(to right, var(--fill-color) ${percentage}%, var(--track-color) ${percentage}%)`);
}

function updateLabels() {
  document.getElementById("volumeValue").textContent = `${state.volumePercent}%`;
  document.getElementById("bassValue").textContent = `${state.bassBoostDb} dB`;
  document.getElementById("voiceValue").textContent = `${state.voiceBoostDb} dB`;
  document.getElementById("trebleValue").textContent = `${state.trebleBoostDb} dB`;
}

function syncInputsFromState() {
  document.getElementById("volumePercent").value = String(state.volumePercent);
  document.getElementById("bassBoostDb").value = String(state.bassBoostDb);
  document.getElementById("voiceBoostDb").value = String(state.voiceBoostDb);
  document.getElementById("trebleBoostDb").value = String(state.trebleBoostDb);
  document.getElementById("mono").checked = state.mono;
  document.getElementById("limiter").checked = state.limiter;
  
  updateLabels();

  // Update slider fill colors
  ['volumePercent', 'bassBoostDb', 'voiceBoostDb', 'trebleBoostDb'].forEach(id => {
    updateSliderBackground(document.getElementById(id));
  });
}

function checkActiveTab(callback) {
  if (activeTabId !== null) {
    callback();
    return;
  }
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (!activeTab || typeof activeTab.id !== "number") {
      setStatus("Unable to detect active tab.");
      return;
    }
    activeTabId = activeTab.id;
    callback();
  });
}

function ensureBackendInitialized(onSuccess) {
  checkActiveTab(() => {
    if (!initializedBackend) {
      // Connect first when the user interacts
      chrome.runtime.sendMessage({ type: "audio:getState", tabId: activeTabId }, (response) => {
        if (!chrome.runtime.lastError && response?.ok) {
          Object.assign(state, response.state);
        }
        initializedBackend = true;
        onSuccess();
      });
    } else {
      onSuccess();
    }
  });
}

function sendMessageToActiveTab(message, onSuccess) {
  checkActiveTab(() => {
    chrome.runtime.sendMessage({ ...message, tabId: activeTabId }, (response) => {
      if (chrome.runtime.lastError) {
        setStatus("Unable to reach background audio service.");
        return;
      }
      if (!response || !response.ok) {
        setStatus(response?.error || "Audio service returned an error.");
        return;
      }
      if (onSuccess) onSuccess(response);
    });
  });
}

function pushPartialState(partialState) {
  ensureBackendInitialized(() => {
    sendMessageToActiveTab(
      {
        type: "audio:setState",
        partialState
      },
      (response) => {
        Object.assign(state, response.state);
        syncInputsFromState();
        statusFromResponse(response, "Applied to current tab.");
      }
    );
  });
}

function bindControls() {
  const rangeMappings = [
    { id: "volumePercent", key: "volumePercent" },
    { id: "bassBoostDb", key: "bassBoostDb" },
    { id: "voiceBoostDb", key: "voiceBoostDb" },
    { id: "trebleBoostDb", key: "trebleBoostDb" }
  ];

  rangeMappings.forEach(({ id, key }) => {
    const el = document.getElementById(id);
    el.addEventListener("input", (event) => {
      updateSliderBackground(el);
      const value = Number(event.target.value);
      state[key] = value;
      updateLabels();
    });
    
    el.addEventListener("change", (event) => {
      const value = Number(event.target.value);
      pushPartialState({ [key]: value });
    });
  });

  ["mono", "limiter"].forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener("change", (event) => {
      const value = Boolean(event.target.checked);
      state[id] = value;
      pushPartialState({ [id]: value });
    });
  });

  document.getElementById("resetButton").addEventListener("click", () => {
    ensureBackendInitialized(() => {
      sendMessageToActiveTab({ type: "audio:reset" }, (response) => {
        Object.assign(state, response.state);
        syncInputsFromState();
        statusFromResponse(response, "Reset complete.");
      });
    });
  });

  // Presets
  document.getElementById("preset-default").addEventListener("click", () => {
    pushPartialState({ volumePercent: 100, bassBoostDb: 0, voiceBoostDb: 0, trebleBoostDb: 0, mono: state.mono, limiter: state.limiter });
  });

  document.getElementById("preset-voice").addEventListener("click", () => {
    pushPartialState({ bassBoostDb: 0, voiceBoostDb: 5, trebleBoostDb: 0 });
  });

  document.getElementById("preset-bass").addEventListener("click", () => {
    pushPartialState({ bassBoostDb: 10, voiceBoostDb: 0, trebleBoostDb: 0 });
  });
}

function init() {
  bindControls();
  syncInputsFromState();
}

init();
