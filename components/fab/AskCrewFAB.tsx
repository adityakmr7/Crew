import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

interface AskCrewFABProps {
  onPress: () => void;
}

export function AskCrewFAB({ onPress }: AskCrewFABProps) {
  return (
    <Pressable onPress={onPress} style={styles.fab} hitSlop={6}>
      <Ionicons name="sparkles" size={22} color="#0b0b0c" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f5b942",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    zIndex: 40,
  },
});
