/* tslint:disable */
/* eslint-disable */

/**
 * One wake-word detection event. Shape matches the Node / Python /
 * Kotlin / Swift bindings.
 *
 * `frameIndex` is exposed as `number` (JavaScript double) rather
 * than `bigint`. One frame = 10 ms, so a JS number holds frame
 * counters exactly up to 2⁵³ ≈ 28 million years of continuous
 * audio — well past any real session length.
 */
export class Detection {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    readonly frameIndex: number;
    readonly score: number;
    readonly timestampSec: number;
}

/**
 * Streaming wake-word inference engine.
 *
 * Construct with `WakeWordEngine.fromBytes(...)` — a browser can't
 * open files by path directly, so there is no `fromPath` on the web
 * channel. Fetch the `.vxrt` bytes yourself and hand them over.
 */
export class WakeWordEngine {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Latest sigmoid score (0..1). Returns 0.5 before any frame has
     * been emitted.
     */
    currentScore(): number;
    /**
     * Construct from raw `.vxrt` bytes (e.g. `fetch()` → ArrayBuffer).
     *
     * Defaults to `threshold=0.9`, `cooldownFrames=100`,
     * `windowSize=200`. Adjust via the setters at any time.
     */
    static fromBytes(bytes: Uint8Array): WakeWordEngine;
    /**
     * Push f32 PCM in `[-1, 1]` (mono, 16 kHz).
     */
    pushPcmF32(pcm: Float32Array): Detection[];
    /**
     * Push i16 PCM (mono, 16 kHz). Returns the detections that
     * crossed threshold during this chunk.
     */
    pushPcmI16(pcm: Int16Array): Detection[];
    /**
     * Wipe accumulated state. Subsequent pushes behave as if from a
     * fresh session.
     */
    reset(): void;
    /**
     * Post-detection cooldown in frames (1 frame = 10 ms). Default 100.
     */
    cooldownFrames: number;
    /**
     * Sigmoid-space detection threshold. Range `[0, 1]`. Default 0.9.
     */
    threshold: number;
}

/**
 * SDK version string (compile-time `CARGO_PKG_VERSION`).
 */
export function version(): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_detection_free: (a: number, b: number) => void;
    readonly __wbg_wakewordengine_free: (a: number, b: number) => void;
    readonly detection_frameIndex: (a: number) => number;
    readonly detection_score: (a: number) => number;
    readonly detection_timestampSec: (a: number) => number;
    readonly version: (a: number) => void;
    readonly wakewordengine_cooldownFrames: (a: number) => number;
    readonly wakewordengine_currentScore: (a: number) => number;
    readonly wakewordengine_fromBytes: (a: number, b: number, c: number) => void;
    readonly wakewordengine_pushPcmF32: (a: number, b: number, c: number, d: number) => void;
    readonly wakewordengine_pushPcmI16: (a: number, b: number, c: number, d: number) => void;
    readonly wakewordengine_reset: (a: number) => void;
    readonly wakewordengine_set_cooldownFrames: (a: number, b: number) => void;
    readonly wakewordengine_set_threshold: (a: number, b: number) => void;
    readonly wakewordengine_threshold: (a: number) => number;
    readonly voxrt_wake_word_abi_version: () => number;
    readonly voxrt_wake_word_create: (a: number, b: number, c: number) => number;
    readonly voxrt_wake_word_current_score: (a: number, b: number) => number;
    readonly voxrt_wake_word_destroy: (a: number) => void;
    readonly voxrt_wake_word_push_pcm_f32: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
    readonly voxrt_wake_word_push_pcm_i16: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
    readonly voxrt_wake_word_reset: (a: number) => number;
    readonly voxrt_wake_word_set_cooldown_frames: (a: number, b: number) => number;
    readonly voxrt_wake_word_set_threshold: (a: number, b: number) => number;
    readonly voxrt_wake_word_version: () => number;
    readonly __wbindgen_export: (a: number, b: number, c: number) => void;
    readonly __wbindgen_export2: (a: number, b: number) => number;
    readonly __wbindgen_export3: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
