import { useUiStore } from "@/store/uiStore";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

export function PerfToggleButton() {
  const isOverlayVisible = useUiStore((s) => s.isOverlayVisible);
  const toggleOverlay = useUiStore((s) => s.toggleOverlay);

  return (
    <Pressable
      onPress={toggleOverlay}
      style={[styles.button, isOverlayVisible && styles.buttonActive]}
      hitSlop={8}
    >
      <Ionicons name="speedometer-outline" size={18} color={isOverlayVisible ? "#0b0b0c" : "#e8e8ea"} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    top: 50,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(20,20,22,0.92)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#3a3a3d",
    zIndex: 50,
  },
  buttonActive: {
    backgroundColor: "#3ddc84",
    borderColor: "#3ddc84",
  },
});
