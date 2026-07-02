import type { Ionicons } from "@expo/vector-icons";

export type TripType = "flight_stay" | "villa" | "experience";

export interface DayHighlight {
  day: number;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}

export interface TripBundle {
  id: string;
  destination: string;
  country: string;
  tripType: TripType;
  tripTypeLabel: string;
  heroImageUrl: string;
  heroImageWidth: number;
  heroImageHeight: number;
  price: number;
  currency: string;
  durationNights: number;
  rating: number;
  reviewCount: number;
  dayHighlights: DayHighlight[];
}
