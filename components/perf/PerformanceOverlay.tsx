import { memo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFrameMetrics } from "./useFrameMetrics";

interface PerformanceOverlayProps {
  enabled: boolean;
}

function fmt(n: number, digits = 1) {
  return n.toFixed(digits);
}

function PerformanceOverlayBase({ enabled }: PerformanceOverlayProps) {
  const { fps, frameDrops, worstFrameMs, jsBusy, p50Ms, p95Ms, totalFrames, reset } =
    useFrameMetrics(enabled);
  const [expanded, setExpanded] = useState(false);

  if (!enabled) return null;

  const fpsColor = fps >= 55 ? "#3ddc84" : fps >= 45 ? "#f5b942" : "#ff5f5f";

  return (
    <View pointerEvents="box-none" style={styles.container}>
      <Pressable onPress={() => setExpanded((v) => !v)} style={styles.card} hitSlop={10}>
        <View style={styles.row}>
          <View style={[styles.dot, { backgroundColor: fpsColor }]} />
          <Text style={[styles.fpsText, { color: fpsColor }]}>{fmt(fps, 0)} FPS</Text>
          {jsBusy && (
            <View style={styles.busyPill}>
              <Text style={styles.busyText}>JS BUSY</Text>
            </View>
          )}
        </View>

        <Text style={styles.dropsText}>Drops (&lt;45fps): {frameDrops}</Text>

        {expanded && (
          <View style={styles.summary}>
            <Text style={styles.summaryLine}>p50 frame: {fmt(p50Ms)}ms</Text>
            <Text style={styles.summaryLine}>p95 frame: {fmt(p95Ms)}ms</Text>
            <Text style={styles.summaryLine}>Worst frame: {fmt(worstFrameMs)}ms</Text>
            <Text style={styles.summaryLine}>Frames sampled: {totalFrames}</Text>
            <Pressable onPress={reset} hitSlop={8} style={styles.resetButton}>
              <Text style={styles.resetText}>Reset session</Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    </View>
  );
}

export const PerformanceOverlay = memo(PerformanceOverlayBase);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 100,
    right: 8,
    zIndex: 50,
  },
  card: {
    backgroundColor: "rgba(20,20,22,0.92)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 128,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#3a3a3d",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fpsText: {
    fontSize: 15,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  busyPill: {
    backgroundColor: "#ff5f5f",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: "auto",
  },
  busyText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
  dropsText: {
    color: "#b5b5b8",
    fontSize: 11,
    marginTop: 2,
  },
  summary: {
    marginTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#3a3a3d",
    paddingTop: 6,
    gap: 2,
  },
  summaryLine: {
    color: "#e8e8ea",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  resetButton: {
    marginTop: 6,
    alignSelf: "flex-start",
  },
  resetText: {
    color: "#6ea8ff",
    fontSize: 11,
    fontWeight: "600",
  },
});
