import { useEffect, useState } from "react";
import { runOnJS, useFrameCallback, useSharedValue } from "react-native-reanimated";

// 1ms-wide buckets, 0-160ms (down to ~6 FPS) — a fixed-size histogram lets us
// derive p50/p95 without ever shipping a raw per-frame sample array off the UI thread.
const HISTOGRAM_BUCKET_MS = 1;
const HISTOGRAM_BUCKETS = 160;
const DROP_FPS_THRESHOLD = 45;
const DISPLAY_THROTTLE_FRAMES = 18; // ~every 300ms at 60fps
const JS_BUSY_CHECK_INTERVAL_MS = 100;
const JS_BUSY_DRIFT_THRESHOLD_MS = 48;

export interface FrameMetricsSnapshot {
  fps: number;
  frameDrops: number;
  worstFrameMs: number;
  totalFrames: number;
  jsBusy: boolean;
  p50Ms: number;
  p95Ms: number;
}

function percentileFromHistogram(histogram: number[], totalFrames: number, fraction: number) {
  "worklet";
  if (totalFrames === 0) return 0;
  const target = totalFrames * fraction;
  let cumulative = 0;
  for (let i = 0; i < histogram.length; i++) {
    cumulative += histogram[i];
    if (cumulative >= target) return i * HISTOGRAM_BUCKET_MS + HISTOGRAM_BUCKET_MS / 2;
  }
  return histogram.length * HISTOGRAM_BUCKET_MS;
}

export function useFrameMetrics(enabled: boolean) {
  const histogram = useSharedValue<number[]>(new Array(HISTOGRAM_BUCKETS).fill(0));
  const worstFrameMs = useSharedValue(0);
  const frameDrops = useSharedValue(0);
  const fpsEma = useSharedValue(60);
  const totalFrames = useSharedValue(0);

  const [snapshot, setSnapshot] = useState<FrameMetricsSnapshot>({
    fps: 60,
    frameDrops: 0,
    worstFrameMs: 0,
    totalFrames: 0,
    jsBusy: false,
    p50Ms: 0,
    p95Ms: 0,
  });

  const pushSnapshot = (fps: number, drops: number, worst: number, total: number) => {
    setSnapshot((prev) => {
      const p50Ms = percentileFromHistogram(histogram.value, total, 0.5);
      const p95Ms = percentileFromHistogram(histogram.value, total, 0.95);
      return { ...prev, fps, frameDrops: drops, worstFrameMs: worst, totalFrames: total, p50Ms, p95Ms };
    });
  };

  const frameCallback = useFrameCallback((frameInfo) => {
    "worklet";
    const dt = frameInfo.timeSincePreviousFrame;
    if (dt == null) return;

    totalFrames.value += 1;
    const instantFps = 1000 / dt;
    fpsEma.value = fpsEma.value * 0.9 + instantFps * 0.1;
    if (dt > worstFrameMs.value) worstFrameMs.value = dt;
    if (instantFps < DROP_FPS_THRESHOLD) frameDrops.value += 1;

    const bucket = Math.min(HISTOGRAM_BUCKETS - 1, Math.max(0, Math.floor(dt / HISTOGRAM_BUCKET_MS)));
    histogram.value[bucket] += 1;

    if (totalFrames.value % DISPLAY_THROTTLE_FRAMES === 0) {
      runOnJS(pushSnapshot)(fpsEma.value, frameDrops.value, worstFrameMs.value, totalFrames.value);
    }
  }, enabled);

  useEffect(() => {
    frameCallback.setActive(enabled);
  }, [enabled, frameCallback]);

  // Independent of the UI-thread frame callback above: a JS-thread timer that
  // only reports drift if something on the JS thread (e.g. a big state update
  // or synchronous work) delayed it. A native-driven animation (Reanimated
  // worklets, the bottom sheet's drag) can stay silky while this still flags busy.
  const [jsBusy, setJsBusy] = useState(false);
  useEffect(() => {
    if (!enabled) {
      setJsBusy(false);
      return;
    }
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const drift = now - last - JS_BUSY_CHECK_INTERVAL_MS;
      last = now;
      setJsBusy(drift > JS_BUSY_DRIFT_THRESHOLD_MS);
    }, JS_BUSY_CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled]);

  const reset = () => {
    histogram.value = new Array(HISTOGRAM_BUCKETS).fill(0);
    worstFrameMs.value = 0;
    frameDrops.value = 0;
    fpsEma.value = 60;
    totalFrames.value = 0;
    setSnapshot({ fps: 60, frameDrops: 0, worstFrameMs: 0, totalFrames: 0, jsBusy: false, p50Ms: 0, p95Ms: 0 });
  };

  return { ...snapshot, jsBusy, reset };
}
