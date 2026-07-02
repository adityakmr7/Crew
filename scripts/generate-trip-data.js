// One-off generator for data/tripBundles.json — not shipped in the app bundle.
// Run: node scripts/generate-trip-data.js
const fs = require("fs");
const path = require("path");

const DESTINATIONS = [
  ["Santorini", "Greece"], ["Kyoto", "Japan"], ["Ubud", "Indonesia"],
  ["Queenstown", "New Zealand"], ["Marrakech", "Morocco"], ["Lisbon", "Portugal"],
  ["Reykjavik", "Iceland"], ["Cape Town", "South Africa"], ["Banff", "Canada"],
  ["Phuket", "Thailand"], ["Amalfi Coast", "Italy"], ["Dubrovnik", "Croatia"],
  ["Zanzibar", "Tanzania"], ["Patagonia", "Chile"], ["Kerala", "India"],
  ["Hoi An", "Vietnam"], ["Tulum", "Mexico"], ["Cusco", "Peru"],
  ["Seville", "Spain"], ["Bora Bora", "French Polynesia"], ["Kraków", "Poland"],
  ["Chiang Mai", "Thailand"], ["Faro", "Portugal"], ["Jaipur", "India"],
  ["Byron Bay", "Australia"], ["Interlaken", "Switzerland"], ["Split", "Croatia"],
  ["Luang Prabang", "Laos"], ["Antigua", "Guatemala"], ["Salar de Uyuni", "Bolivia"],
];

const TRIP_TYPES = [
  { key: "flight_stay", label: "Flight + Stay" },
  { key: "villa", label: "Villa" },
  { key: "experience", label: "Experience" },
];

const HIGHLIGHT_ICONS = [
  "airplane", "bed", "restaurant", "sunny", "compass", "camera",
  "boat", "walk", "trail-sign", "wine", "sunny-outline", "leaf",
];

const HIGHLIGHT_TEMPLATES = [
  "Arrival & sunset welcome dinner",
  "Guided old-town walking tour",
  "Free morning, private beach access",
  "Full-day boat excursion to nearby islands",
  "Local cooking class + market visit",
  "Sunrise viewpoint hike",
  "Spa afternoon & rooftop dinner",
  "Day trip to nearby national park",
  "Cultural village visit + craft workshop",
  "Departure, late checkout included",
];

function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function next() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function buildHighlights(rng, nights) {
  const count = 3 + Math.floor(rng() * 2); // 3-4
  const days = new Set();
  while (days.size < count) days.add(1 + Math.floor(rng() * Math.max(nights, count)));
  return Array.from(days)
    .sort((a, b) => a - b)
    .map((day) => ({
      day,
      icon: pick(rng, HIGHLIGHT_ICONS),
      title: pick(rng, HIGHLIGHT_TEMPLATES),
    }));
}

const TOTAL = 110;
const bundles = [];

for (let i = 0; i < TOTAL; i++) {
  const rng = seededRandom(i * 97 + 13);
  const [destination, country] = pick(rng, DESTINATIONS);
  const tripType = pick(rng, TRIP_TYPES);
  const nights = 2 + Math.floor(rng() * 8); // 2-9 nights
  const price = Math.round((150 + rng() * 2800) / 5) * 5;
  const rating = Math.round((3.6 + rng() * 1.4) * 10) / 10;
  const reviewCount = 12 + Math.floor(rng() * 1400);
  const seed = `crew-${i}-${destination.toLowerCase().replace(/\s+/g, "-")}`;

  bundles.push({
    id: `bundle-${i + 1}`,
    destination,
    country,
    tripType: tripType.key,
    tripTypeLabel: tripType.label,
    heroImageUrl: `https://picsum.photos/seed/${seed}/800/600`,
    heroImageWidth: 800,
    heroImageHeight: 600,
    price,
    currency: "USD",
    durationNights: nights,
    rating,
    reviewCount,
    dayHighlights: buildHighlights(rng, nights),
  });
}

const outPath = path.join(__dirname, "..", "data", "tripBundles.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(bundles, null, 2) + "\n");
console.log(`Wrote ${bundles.length} bundles to ${outPath}`);
