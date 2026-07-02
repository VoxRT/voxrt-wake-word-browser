# voxrt-wake-word-browser

Always-on wake-phrase detection running **entirely inside a browser tab**, no server, no download-first, no native install. Detects the phrase **"Hey Assistant"** on 16 kHz mono microphone audio.

- **Status: shipping, browser-ready.** Verified end-to-end via live microphone on Chrome (V8) and Safari (JSC) across Mac and mobile.
- Current version: `v0.1.0`
- Target: any modern browser with WebAssembly SIMD128 + AudioWorklet — Chrome 91+, Firefox 89+, Safari 16.4+, iOS Safari 16.4+, Android Chrome, Edge 91+.
- Bundle: ~200 KB WebAssembly runtime + 100 KB `.vxrt` model = ~300 KB total download.
- License: Apache-2.0 (wrapper sources) · proprietary (compiled runtime, redistribution allowed via this SDK)

## Try it in 30 seconds

Live demo: **[voxrt.github.io/voxrt-wake-word-browser/](https://voxrt.github.io/voxrt-wake-word-browser/)** — click "Start listening", say "Hey Assistant".

## Positioning — read this before shipping to production

The three deployment tiers we support, most-secure first:

| Tier | SDK | Model delivery | Anti-RE bar | Recommended for |
|---|---|---|---|---|
| **Native** | [Android](https://github.com/VoxRT/voxrt-wake-word-android) / [iOS](https://github.com/VoxRT/voxrt-wake-word-ios) / [Linux](https://github.com/VoxRT/voxrt-wake-word-linux) | Embedded in the app / SDK asset | Full (ELF strip, RELRO, symbol allowlist, AES-256-GCM weights, `obfstr!` on strings, planned anti-ptrace + text-hash integrity) | Production consumer apps, embedded devices, offline appliances |
| **Browser (this SDK)** | **`@voxrt/wake-word-browser`** (npm) | Bundled `.vxrt`, or fetched from your CDN | Partial: `obfstr!` for compile-time strings, AES-GCM weight encryption, wasm-opt name mangling. **WASM is decompilable in Chrome DevTools by design** — RE bar is fundamentally lower than native binaries. | Free demos, prototypes, marketing landing pages, quick internal tools |
| **Browser + server-gated model** _(v0.2+ roadmap)_ | Same npm package, `.vxrt` fetched from an auth-token gated endpoint | Runtime asks your backend for a signed model URL per session | Same as above, plus revocable model access + audit trail | Commercial browser deployments where model IP matters more than device reach |

**If your product monetises the wake-word capability itself (custom phrase, brand-specific), we recommend the native SDKs.** Browsers give a low-friction demo surface and prototyping speed, not maximum-security model distribution.

## What is VoxRT?

VoxRT is a from-scratch inference runtime for on-device speech models. No ONNX Runtime, no PyTorch Mobile, no LiteRT — a custom Rust core sized and tuned for streaming voice workloads. This package is the WebAssembly port of that same runtime — same `.vxrt` model format, same detection schema as our Android (Kotlin `VoxrtWakeWordEngine`), iOS (Swift `VoxrtWakeWordEngine`), Linux (`voxrt_wake_word_*` C ABI), Python, Node, and Go bindings.

Sister browser modules are on the roadmap: `voxrt-silero-browser` (VAD), `voxrt-asr-browser` (streaming ASR). All share this runtime.

## Model quality

Same wake-word model as the native SDKs (`voxrt_wake_word.vxrt` v0.1.0). Test split: 5,240 positive utterances + 6,416 hard-negative utterances (isolated "Hey", isolated "Assistant", competitor wake-words like "Hey Siri", phonetic neighbours, arbitrary speech, non-speech audio). All speakers disjoint from train + val.

- **ROC AUC: 0.9966**
- **Average precision (PR AUC): 0.9899**
- Default threshold **0.90** hits **precision 0.993 / recall 0.982** on the test split.

Full precision/recall/FPR table lives in the [Linux SDK README](https://github.com/VoxRT/voxrt-wake-word-linux#model-quality) — identical model.

## Performance

60-second offline benchmark, WebAssembly with SIMD128, cumulative RTF (`wall_time / audio_time`) across the actual push path:

| Device | Browser | RTF | Native reference (same model, NEON) |
|---|---|---|---|
| MacBook Pro M4 | Chrome | **0.16 %** | — |
| iPhone 13 Pro Max (A15) | Safari | **0.23 %** | — |
| Snapdragon 662 (A73) | Chrome Android | **1.17 %** | 2.1 % (Android SDK, native NEON, HIGH_PERF) |
| Raspberry Pi Zero 2 W (A53) | — | (native ref only) | 5.3 % (Linux SDK, native NEON) |

WASM SIMD128 recovers most of the native-NEON perf on the same chip (2.4× penalty vs native NEON on A73), and on modern CPUs (M4 / A15) the browser overhead disappears entirely.

## Install

```sh
npm install @voxrt/wake-word-browser
```

Or CDN:

```html
<script type="module">
  import init, { WakeWordEngine } from
    "https://unpkg.com/@voxrt/wake-word-browser@0.1.0/voxrt-wake-word-browser.js";
</script>
```

The npm package ships everything you need in one install: the WebAssembly runtime, the JavaScript glue + TypeScript types, **and the wake-phrase model file** (`voxrt_wake_word.vxrt`, plaintext v2 — the SDK build is compiled without a decrypt key, so there's no crypto material anywhere in the shipped binary and no risk to the native SDKs' model IP).

If you want a custom-phrase or brand-specific model, contact help@voxrt.com — those ship through the native SDKs. See the [tier table](#positioning--read-this-before-shipping-to-production) at the top of this README for the security trade-off.

## Quick start

The full runnable page lives at [`examples/live-mic-quickstart/`](examples/live-mic-quickstart/). Minimum you need:

```html
<!doctype html>
<html>
<body>
<button id="start">Listen</button>
<pre id="log"></pre>
<script type="module">
import init, { WakeWordEngine } from
  "./node_modules/@voxrt/wake-word-browser/voxrt-wake-word-browser.js";

document.getElementById("start").addEventListener("click", async () => {
  await init();
  const engine = WakeWordEngine.fromBytes(new Uint8Array(
    await (await fetch("voxrt_wake_word.vxrt")).arrayBuffer()));
  engine.threshold = 0.9;

  const stream = await navigator.mediaDevices.getUserMedia({audio: true});
  const ac = new AudioContext({sampleRate: 16000});
  const src = ac.createMediaStreamSource(stream);
  const proc = ac.createScriptProcessor(512, 1, 1);
  const mute = ac.createGain(); mute.gain.value = 0;
  const pcm = new Int16Array(512);

  proc.addEventListener("audioprocess", (e) => {
    const input = e.inputBuffer.getChannelData(0);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    for (const d of engine.pushPcmI16(pcm)) {
      document.getElementById("log").textContent +=
        `wake! t=${d.timestampSec.toFixed(3)}s score=${d.score.toFixed(4)}\n`;
    }
  });
  src.connect(proc);
  proc.connect(mute);
  mute.connect(ac.destination);
});
</script>
</body>
</html>
```

Serve it over HTTPS (or `localhost`) — browsers refuse `getUserMedia` on plain HTTP for non-loopback origins.

## API

```ts
class WakeWordEngine {
  static fromBytes(bytes: Uint8Array): WakeWordEngine;

  pushPcmI16(pcm: Int16Array): Detection[];
  pushPcmF32(pcm: Float32Array): Detection[];

  currentScore(): number;
  reset(): void;

  threshold: number;         // default 0.9
  cooldownFrames: number;    // default 100 (= 1.0 s at 10 ms hop)
}

interface Detection {
  frameIndex: number;        // 0-based frame counter (10 ms/frame)
  timestampSec: number;
  score: number;             // sigmoid, [0, 1]
}

function version(): string;
```

Detection schema is identical to the Kotlin (`VoxrtWakeWordDetection`), Swift (`VoxrtWakeWordDetection`), Node (`Detection`), Python (`Detection`), and Go (`wakeword.Detection`) bindings on the other channels.

## Tuning

- **`threshold`** — sigmoid space `[0, 1]`. Default `0.9`. Lower for higher recall (more triggers, more false positives); raise for higher precision.
- **`cooldownFrames`** — post-detection silence in 10-ms frames. Default `100` = 1.0 s. Prevents multi-fire on a long utterance.

## Browser support

WebAssembly SIMD128 is stable in every modern browser:

| Engine | Minimum version | Released |
|---|---|---|
| Chrome / Edge (V8) | 91 | May 2021 |
| Firefox | 89 | June 2021 |
| Safari (JSC) — desktop + iOS | 16.4 | Mar 2023 |

If you must support older Safari (<16.4), we don't ship a scalar-fallback build in v0.1.x. The `AudioWorkletNode` API this SDK relies on has the same 16.4 floor in Safari, so there is no useful earlier target.

## License

- **Wrapper sources** (`voxrt_wake_word_browser` crate, wasm-bindgen glue, examples): Apache-2.0.
- **Compiled runtime** (`voxrt-wake-word-browser_bg.wasm` and its symbol table): proprietary binary. Redistribution is allowed **only as an unmodified part of this SDK package**. See [`LICENSE-BINARY`](LICENSE-BINARY).
- **Wake-phrase weights** (`voxrt_wake_word.vxrt` fetched at runtime): proprietary in-house model, trained on synthetic and licensed speech, no upstream license obligations.
