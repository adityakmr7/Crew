import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import type { TripBundle } from "@/data/tripTypes";
import { CardImage } from "./CardImage";
import { DayHighlightsRow } from "./DayHighlightsRow";

const TYPE_COLORS: Record<TripBundle["tripType"], string> = {
  flight_stay: "#3a7bd5",
  villa: "#2e8b57",
  experience: "#c2703d",
};

interface TripCardProps {
  bundle: TripBundle;
}

function TripCardBase({ bundle }: TripCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [everExpanded, setEverExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
    setEverExpanded((prev) => prev || true);
  }, []);

  return (
    <View style={styles.card}>
      <CardImage
        uri={bundle.heroImageUrl}
        width={bundle.heroImageWidth}
        height={bundle.heroImageHeight}
      />

      <View style={[styles.badge, { backgroundColor: TYPE_COLORS[bundle.tripType] }]}>
        <Text style={styles.badgeText}>{bundle.tripTypeLabel}</Text>
      </View>

      <Animated.View layout={LinearTransition.duration(220)} style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.destination} numberOfLines={1}>
            {bundle.destination}
          </Text>
          <Text style={styles.country} numberOfLines={1}>
            {bundle.country}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.price}>${bundle.price.toLocaleString()}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.meta}>{bundle.durationNights} nights</Text>
          <Text style={styles.metaDot}>•</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color="#f5b942" />
            <Text style={styles.meta}>
              {bundle.rating.toFixed(1)} ({bundle.reviewCount})
            </Text>
          </View>
        </View>

        <Pressable
          onPress={toggleExpanded}
          style={styles.detailsToggle}
          hitSlop={8}
        >
          <Text style={styles.detailsToggleText}>
            {expanded ? "Hide details" : "Details"}
          </Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color="#8e8e93"
          />
        </Pressable>

        {expanded && (
          <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)}>
            {everExpanded && <DayHighlightsRow highlights={bundle.dayHighlights} />}
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

function areEqual(prev: TripCardProps, next: TripCardProps) {
  return prev.bundle.id === next.bundle.id;
}

export const TripCard = memo(TripCardBase, areEqual);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#151517",
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: "hidden",
  },
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  body: {
    padding: 14,
    gap: 8,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  destination: {
    color: "#f2f2f3",
    fontSize: 17,
    fontWeight: "700",
    flexShrink: 1,
  },
  country: {
    color: "#8e8e93",
    fontSize: 13,
    marginLeft: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaDot: {
    color: "#4a4a4d",
  },
  meta: {
    color: "#b5b5b8",
    fontSize: 13,
  },
  price: {
    color: "#f2f2f3",
    fontSize: 14,
    fontWeight: "700",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailsToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  detailsToggleText: {
    color: "#8e8e93",
    fontSize: 13,
    fontWeight: "600",
  },
});
