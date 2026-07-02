import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { DayHighlight } from "@/data/tripTypes";

interface DayHighlightsRowProps {
  highlights: DayHighlight[];
}

export function DayHighlightsRow({ highlights }: DayHighlightsRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {highlights.map((highlight) => (
        <View key={highlight.day} style={styles.chip}>
          <Text style={styles.dayLabel}>Day {highlight.day}</Text>
          <View style={styles.iconRow}>
            <Ionicons name={highlight.icon} size={16} color="#e8e8ea" />
            <Text style={styles.title} numberOfLines={2}>
              {highlight.title}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 2,
  },
  chip: {
    width: 150,
    backgroundColor: "#232326",
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  dayLabel: {
    color: "#8e8e93",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  title: {
    flex: 1,
    color: "#e8e8ea",
    fontSize: 12,
    lineHeight: 16,
  },
});
