import { useCallback, useRef } from "react";
import { StatusBar, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AskCrewSheet } from "@/components/chat/AskCrewSheet";
import { FeedList } from "@/components/feed/FeedList";
import { AskCrewFAB } from "@/components/fab/AskCrewFAB";
import { PerformanceOverlay } from "@/components/perf/PerformanceOverlay";
import { PerfToggleButton } from "@/components/perf/PerfToggleButton";
import type { BottomSheetHandle } from "@/components/ui/BottomSheet";
import { useUiStore } from "@/store/uiStore";

export default function Index() {
  const sheetRef = useRef<BottomSheetHandle>(null);
  const isOverlayVisible = useUiStore((s) => s.isOverlayVisible);

  const openSheet = useCallback(() => {
    sheetRef.current?.open();
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" />
      <FeedList />
      <AskCrewFAB onPress={openSheet} />
      <PerfToggleButton />
      <PerformanceOverlay enabled={isOverlayVisible} />
      <AskCrewSheet ref={sheetRef} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0b0b0c",
  },
});
