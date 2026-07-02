# live-mic-quickstart — browser wake-word demo with live-tuning UI

Single-page browser demo:

- Loads `@voxrt/wake-word-browser` v0.1.1 runtime + `voxrt_wake_word.vxrt` v0.1.0 model from GitHub CDN.
- Requests microphone permission and pushes real audio into the engine every 32 ms.
- Live UI: mic RMS bar, peak-score meter, threshold slider, cumulative RTF counter, `🎯 WAKE` event log, and a one-tap 60-second synthetic benchmark you can use for cross-device perf comparison.
- Runs entirely locally — no sample of your audio leaves the tab.

## Run it

Any HTTPS-serving static host will work (localhost too, browsers give it a special exemption from the mic-secure-origin rule):

```sh
# Python 3
python3 -m http.server 8000

# Node
npx http-server -p 8000

# any other static server
```

Then open `http://localhost:8000/` and tap **"Tap to start listening"**. Say "Hey Assistant".

For a **non-localhost** hosted preview you need HTTPS — browsers refuse `getUserMedia` on plain HTTP for LAN / cloud origins.

## What it teaches

- `WakeWordEngine.fromBytes(Uint8Array)` construction from `.vxrt` bytes.
- `engine.pushPcmI16(Int16Array)` → `Detection[]` streaming push.
- Getting 16 kHz mono int16 out of the browser mic via `AudioContext({sampleRate: 16000})` + `ScriptProcessorNode` + Int16 quantisation.
- Reading `engine.currentScore()` for a continuous live signal (not just events).
- Threshold + cooldown tuning at runtime via `engine.threshold = ...` / `engine.cooldownFrames = ...`.
- A batched offline benchmark pattern that yields stable RTF numbers without `performance.now()` quantisation noise.

## About the model

Public "Hey Assistant" wake-word — v0.1.0 from [voxrt-wake-word-models](https://github.com/VoxRT/voxrt-wake-word-models/releases/tag/v0.1.0). Same model that ships in the native SDKs. If you want a custom wake-phrase for your product or brand, see [voxrt.com](https://voxrt.com) or contact help@voxrt.com.

## Where to go next

- The main SDK README (one level up) covers Tier 1 (this SDK — free demos), Tier 2 (server-gated model delivery), and Tier 3 (native SDKs for production security).
- If you want more control over the audio path (e.g. proper `AudioWorkletNode` instead of `ScriptProcessorNode`, VAD gate, wake-word → downstream ASR pipeline), the API surface is small enough that you can port this HTML into any framework in an hour.
