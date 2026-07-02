import tripBundles from "@/data/tripBundles.json";
import type { TripBundle } from "@/data/tripTypes";

const SIMULATED_LATENCY_MS = 700;

export function loadFeed(): Promise<TripBundle[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(tripBundles as TripBundle[]), SIMULATED_LATENCY_MS);
  });
}
