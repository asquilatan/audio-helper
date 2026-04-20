const pipelines = new Map();

function applyState(pipeline, state) {
  pipeline.state = { ...state };
  pipeline.gain.gain.value = Math.max(0, state.volumePercent / 100);
  pipeline.bassFilter.gain.value = state.bassBoostDb;
  pipeline.voiceFilter.gain.value = state.voiceBoostDb;
  pipeline.trebleFilter.gain.value = state.trebleBoostDb;
  pipeline.stereoGain.gain.value = state.mono ? 0 : 1;
  pipeline.monoOutputGain.gain.value = state.mono ? 1 : 0;

  if (state.limiter) {
    pipeline.compressor.threshold.value = -18;
    pipeline.compressor.ratio.value = 4;
    pipeline.compressor.attack.value = 0.003;
    pipeline.compressor.release.value = 0.25;
  } else {
    pipeline.compressor.threshold.value = 0;
    pipeline.compressor.ratio.value = 1;
    pipeline.compressor.attack.value = 0.001;
    pipeline.compressor.release.value = 0.05;
  }
}

async function startPipeline(tabId, streamId, state) {
  await stopPipeline(tabId);

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId
      }
    },
    video: false
  });

  const context = new AudioContext();
  const source = context.createMediaStreamSource(stream);
  const gain = context.createGain();
  const bassFilter = context.createBiquadFilter();
  const voiceFilter = context.createBiquadFilter();
  const trebleFilter = context.createBiquadFilter();
  const compressor = context.createDynamicsCompressor();
  const stereoGain = context.createGain();
  const splitter = context.createChannelSplitter(2);
  const monoGainLeft = context.createGain();
  const monoGainRight = context.createGain();
  const merger = context.createChannelMerger(2);
  const monoOutputGain = context.createGain();

  bassFilter.type = "lowshelf";
  bassFilter.frequency.value = 180;
  voiceFilter.type = "peaking";
  voiceFilter.frequency.value = 2200;
  voiceFilter.Q.value = 1.1;
  trebleFilter.type = "highshelf";
  trebleFilter.frequency.value = 4200;
  monoGainLeft.gain.value = 0.5;
  monoGainRight.gain.value = 0.5;

  source.connect(gain);
  gain.connect(bassFilter);
  bassFilter.connect(voiceFilter);
  voiceFilter.connect(trebleFilter);
  trebleFilter.connect(compressor);

  compressor.connect(stereoGain);
  stereoGain.connect(context.destination);

  compressor.connect(splitter);
  splitter.connect(monoGainLeft, 0);
  splitter.connect(monoGainLeft, 1);
  splitter.connect(monoGainRight, 0);
  splitter.connect(monoGainRight, 1);
  monoGainLeft.connect(merger, 0, 0);
  monoGainRight.connect(merger, 0, 1);
  merger.connect(monoOutputGain);
  monoOutputGain.connect(context.destination);

  const pipeline = {
    stream,
    context,
    source,
    gain,
    bassFilter,
    voiceFilter,
    trebleFilter,
    compressor,
    stereoGain,
    monoOutputGain,
    state: {}
  };

  applyState(pipeline, state);
  await context.resume();
  pipelines.set(tabId, pipeline);
}

async function stopPipeline(tabId) {
  const pipeline = pipelines.get(tabId);
  if (!pipeline) {
    return;
  }

  try {
    pipeline.source.disconnect();
    pipeline.gain.disconnect();
    pipeline.bassFilter.disconnect();
    pipeline.voiceFilter.disconnect();
    pipeline.trebleFilter.disconnect();
    pipeline.compressor.disconnect();
    pipeline.stereoGain.disconnect();
    pipeline.monoOutputGain.disconnect();
  } catch (_error) {
    // Ignore disconnect races during teardown.
  }

  pipeline.stream.getTracks().forEach((track) => track.stop());
  await pipeline.context.close();
  pipelines.delete(tabId);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.target !== "offscreen") {
    return;
  }

  (async () => {
    try {
      if (message.type === "offscreen:start") {
        await startPipeline(message.tabId, message.streamId, message.state);
        sendResponse({ ok: true });
        return;
      }

      if (message.type === "offscreen:updateState") {
        const pipeline = pipelines.get(message.tabId);
        if (!pipeline) {
          sendResponse({ ok: false, error: "Pipeline not found for tab." });
          return;
        }
        applyState(pipeline, message.state);
        sendResponse({ ok: true });
        return;
      }

      if (message.type === "offscreen:stop") {
        await stopPipeline(message.tabId);
        sendResponse({ ok: true });
        return;
      }

      sendResponse({ ok: false, error: "Unknown offscreen message type." });
    } catch (error) {
      sendResponse({ ok: false, error: error.message || "Offscreen processing failed." });
    }
  })();

  return true;
});
