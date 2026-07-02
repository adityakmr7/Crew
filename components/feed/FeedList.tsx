import type { TripBundle } from "@/data/tripTypes";
import { useTripFeed } from "@/hooks/useTripFeed";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";
import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { TripCard } from "./TripCard";

function renderItem({ item }: ListRenderItemInfo<TripBundle>) {
  return <TripCard bundle={item} />;
}

function keyExtractor(item: TripBundle) {
  return item.id;
}

function getItemType(item: TripBundle) {
  return item.tripType;
}

function SkeletonRow() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonLineWide} />
      <View style={styles.skeletonLineNarrow} />
    </View>
  );
}

function FeedListBase() {
  const { data: bundles } = useTripFeed();

  if (!bundles) {
    return (
      <View style={styles.skeletonContainer}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </View>
    );
  }

  return (
    <FlashList
      data={bundles}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemType={getItemType}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
    />
  );
}

export const FeedList = memo(FeedListBase);

const styles = StyleSheet.create({
  contentContainer: {
    paddingTop: 8,
    paddingBottom: 120,
  },
  skeletonContainer: {
    paddingTop: 8,
  },
  skeletonCard: {
    height: 260,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: "#151517",
    padding: 14,
    justifyContent: "flex-end",
    gap: 8,
  },
  skeletonImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 170,
    backgroundColor: "#232326",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  skeletonLineWide: {
    height: 14,
    width: "60%",
    borderRadius: 4,
    backgroundColor: "#232326",
  },
  skeletonLineNarrow: {
    height: 12,
    width: "35%",
    borderRadius: 4,
    backgroundColor: "#232326",
  },
});
