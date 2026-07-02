# Prompting notes

Scope prompts to one piece at a time rather than "implement the whole thing." A broad prompt makes changes land across many files at once — if one dependency turns out broken (e.g. the `@gorhom/bottom-sheet` / Reanimated 4 incompatibility hit in this project), unwinding it means reverting several unrelated areas together instead of just one prompt's worth of work.

## Example: scoping the mock data

> In the crow app, create only the mock trip data — a script that generates ~100+ travel bundle objects (destination, country, trip type, remote hero image URL with explicit width/height, price, duration, rating, review count, and 3-4 day-by-day highlights with icon+text) as a local JSON file, plus the TypeScript types for it. Don't touch any UI components yet.

Why this works:
- **"create only"** — explicit scope boundary; without it, "mock data" gets treated as step 1 of a bigger task and the assistant keeps going.
- **Names the exact data shape** — otherwise the schema gets invented on the spot, and a later prompt for the feed UI may expect different field names, causing a mismatch to fix later.
- **"Don't touch any UI components yet"** — blocks wiring it into the feed as a "helpful" next step.

Same pattern for the other pieces:
- "Build only the performance overlay, no chat sheet yet."
- "Build the Ask Crew chat sheet." (separately, once the overlay is reviewed)

If a later piece's dependency breaks, only that prompt's changes need reverting — not three prompts' worth.
