# Crew — Trip Discovery Feed + Ask Crew

A focused slice of the Crew mobile experience: a high-performance, 100+ item travel discovery feed paired with an AI chat assistant in a draggable bottom sheet, plus a from-scratch performance overlay. Built for a take-home assignment — the goal was to demonstrate engineering for smooth, well-instrumented React Native, not feature breadth.

See [PERFORMANCE.md](./PERFORMANCE.md) for FPS methodology, the identified bottleneck (before/after), and an honest trade-off. See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for the original build plan.

## Setup

```bash
nvm use          # Node 20+ required — see "Known limitations" below
npm install
npx expo start
```

Then open in an Android emulator, iOS simulator, or Expo Go from the printed QR code. `npx expo start --web` also works for quick iteration, with caveats (see below).

## Architecture

```
app/                   Expo Router routes (typed routes + React Compiler enabled)
components/
  feed/                FlashList feed, cards, expandable day-highlights, image w/ placeholder
  chat/                Ask Crew sheet content: header, message list, streaming bubbles, input
  ui/BottomSheet.tsx    Reusable draggable bottom sheet (see below)
  perf/                Frame-metrics hook + HUD, toggled via floating button
  fab/                 Floating action button that opens the sheet
hooks/useTripFeed.ts    TanStack Query wrapper around the mocked feed fetch
store/                  Zustand: chat messages/streaming state, overlay visibility
services/               Mocked feed fetch (simulated delay) + mocked token-stream assistant
data/                   Generated mock trip bundles (JSON) + canned chat responses
scripts/                One-off generator for the mock trip data
```

## State management rationale

Two libraries, split by the *kind* of state each owns — not one library doing everything:

- **TanStack Query** owns *server-state*: the (mocked) feed fetch, via `useTripFeed()`. It gets loading/error/success status and in-memory caching for free — a second mount of the feed screen doesn't re-pay the simulated network delay or flash the skeleton again. Even though the fetch is mocked today, treating it as server-state from the start means swapping in a real API later is a one-line change to `services/loadFeed.ts`, not a rewrite of how the feed screen consumes data.
- **Zustand**, scoped narrowly, owns *client/UI state*: `chatStore` (messages + streaming flag — needs to survive the sheet closing and reopening for the session) and `uiStore` (just the overlay-visibility toggle).
- Deliberately in **neither**: card expand/collapse (local `useState` per card — must not re-render the list or sibling cards), bottom-sheet snap state (Reanimated shared values / refs, not a store), and all perf-overlay metrics (shared values only, never touch React state on the per-frame hot path). Putting any of these in global state would force unrelated re-renders — exactly what virtualized-list and 60fps-gesture performance depends on avoiding.

## The custom bottom sheet

`components/ui/BottomSheet.tsx` is hand-built on `react-native-reanimated` + `react-native-gesture-handler` directly, not `@gorhom/bottom-sheet`. That library's percentage snap-point calculation depends on a container-height shared value that never resolves against `react-native-reanimated@4` / the split-out `react-native-worklets` package on this Expo SDK 54 stack — the sheet mounts (its content is in the tree) but never actually animates open. This is a confirmed, currently-unresolved upstream compatibility gap, not a mistake in this codebase; several open issues on the library's repo describe the exact same symptom.

The component is written generically (snap ratios, `open`/`openFull`/`close`/`snapTo` imperative handle, optional keyboard-awareness) so it isn't chat-specific and could back any other sheet in the app.

## Performance overlay

Toggle via the floating speedometer button (top-left). Shows live FPS, a frame-drop counter (<45fps), a JS-thread-busy indicator, and — tap the card to expand — a session summary (p50/p95 frame time, worst frame, frames sampled). Built from scratch per the assignment's constraints (no React Native dev-menu FPS monitor). Full methodology in [PERFORMANCE.md](./PERFORMANCE.md).

## Known limitations

- **AI responses are mocked**, per the assignment's own technical constraints ("Mock data for each response works just for testing with some delay — no streaming required"). The *visual* requirement — token-by-token streaming with a loading indicator before the first token — is still fully implemented (`services/mockAssistant.ts`), just against a canned response set instead of a live model.
- **Chat history persists for the session only** (in-memory Zustand store), not across app restarts — no `AsyncStorage` layer, since "session lifetime" is what the brief asks for.
- **Developed and iteration-tested primarily via `expo start --web`** in this environment, which has no Android emulator or iOS simulator attached. One thing that follows from that: the FPS numbers in `PERFORMANCE.md` are left as a template to fill in from a real device/emulator run — the web preview's frame timing is contaminated by the browser-automation tooling used during development and isn't representative of native performance. Browsers also don't cover content with a native keyboard the way iOS/Android do, so the sheet's keyboard-avoidance (auto-expand to full height + `useAnimatedKeyboard()`-driven lift) can only be meaningfully verified on a real device/simulator, not in this web preview.
- **Node 20+ is required** (see `.nvmrc`) — Metro's config loader uses `Array.prototype.toReversed`, unavailable on Node 18, which Expo SDK 54 doesn't itself enforce.
- **"Mid-range Android device" target** hasn't been validated on real/emulated hardware in this environment; the perf overlay is built and verified to correctly report FPS/drops/JS-busy/percentiles, but the actual pass/fail against the ≥58fps / ≥55fps / zero-drops-below-45 targets needs a device run.



LINK: https://www.loom.com/share/bd7d6e8bec2d4f91ac20f9bdfb2dbf24
