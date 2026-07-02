interface CannedEntry {
  keywords: string[];
  response: string;
}

const CANNED: CannedEntry[] = [
  {
    keywords: ["villa", "villas"],
    response:
      "Villas in Ubud and Tulum are trending this month — private pools, 4-6 nights, from $180/night. Want me to filter the feed to villa-only bundles, or pull up specific dates?",
  },
  {
    keywords: ["cheap", "budget", "affordable"],
    response:
      "For budget-friendly trips, Chiang Mai, Hoi An, and Antigua all have Flight + Stay bundles under $400 for 4+ nights. I can sort the feed by price if that's helpful.",
  },
  {
    keywords: ["weather", "rain", "season"],
    response:
      "Depends on the destination — I'd need to know where you're eyeing. Generally, Southeast Asia is best Nov-Mar (dry season), while the Mediterranean is best May-Sep. Which trip are you comparing?",
  },
  {
    keywords: ["reschedule", "change", "cancel"],
    response:
      "I can loop in a human travel expert for date changes or cancellations on an existing booking — since this is a demo build there's no live reservation attached yet, but that's exactly the kind of in-trip request Crew handles in production.",
  },
];

const FALLBACK =
  "Got it — I can help narrow down destinations, compare prices across bundles, or check what's included day-by-day. What matters most for this trip: budget, dates, or vibe?";

export function getMockResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  for (const entry of CANNED) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.response;
    }
  }
  return FALLBACK;
}
