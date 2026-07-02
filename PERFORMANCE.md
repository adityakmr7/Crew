# Performance

## FPS measurement methodology

The overlay (`components/perf/useFrameMetrics.ts` + `PerformanceOverlay.tsx`, toggled via the floating speedometer button — no dev-menu FPS monitor is used) is built from scratch on Reanimated's `useFrameCallback`, not a JS-thread `requestAnimationFrame` loop:

- **Sampling**: `useFrameCallback` fires on the UI thread on every native frame (i.e. up to display refresh rate, not throttled). Each tick computes `dt` (`timeSincePreviousFrame`), converts it to instantaneous FPS, and updates a handful of `useSharedValue`s — an exponential moving average for the live FPS reading, a running max for "worst frame," a counter for frames below 45 FPS, and a **fixed-size histogram** (160 buckets, 1ms each, covering 0–160ms of frame time). Sampling every frame — not a periodic poll — is what makes the frame-drop counter and worst-frame trustworthy: a poll-based sampler can miss a single slow frame between polls entirely.
- **Why a histogram instead of storing raw samples**: storing every frame's duration for a 60s session at 60fps is ~3600 numbers, which is fine memory-wise, but computing percentiles from it means sorting on every read. Bucketing into a histogram lets p50/p95 be derived with a single cumulative-sum pass over 160 buckets regardless of session length, and avoids ever shipping a growing array off the UI thread.
- **Self-cost containment**: the per-frame work above is all on the UI thread and touches shared values only (no React state, no re-render). The JS-side display is refreshed via `runOnJS` on a throttle (every 18 frames, ~300ms at 60fps) — this is deliberate: the overlay's own React re-render cost cannot itself be the thing perturbing the FPS it reports. `PerformanceOverlay` also short-circuits to `null` when disabled.
- **JS-thread-busy indicator**: a *separate*, JS-thread-only mechanism — `setInterval` at a nominal 100ms, comparing actual elapsed time to expected. Drift beyond 48ms flags "JS BUSY." This is intentionally decoupled from the UI-thread FPS measurement: a Reanimated-driven gesture (like the bottom sheet's drag) can stay perfectly smooth on the UI thread while the JS thread is blocked by something else entirely (a big `setState`, JSON parsing, etc.), and that's a distinct failure mode the FPS number alone won't surface.

## Bottleneck: layout animation on FlashList's recycled cell

**Symptom**: dropped frames during continuous feed scroll, reported by the overlay.

**Root cause**: `TripCard`'s outer view — the exact node FlashList recycles and repositions as cells scroll in/out — was wrapped in `Animated.View` with `layout={LinearTransition.duration(220)}`. Reanimated's `layout` prop intercepts *any* frame change on that view. FlashList's recycling works by reassigning each pooled view a new y-position as you scroll; that reposition is itself a frame change, so Reanimated was playing a 220ms spring animation on every recycled cell, every time it was repositioned — continuous, unnecessary animation work stacked on top of the actual scroll.

**Fix**: moved the `layout` transition off the recycled root and onto the inner `body` view — the one that actually changes size, and only when a card's day-highlights expand/collapse. That view's position *relative to its own parent* is untouched by FlashList repositioning the outer cell, so the transition now only fires on genuine expand/collapse, never on scroll. See `components/feed/TripCard.tsx`.

**Evidence**: I do not have an Android device or emulator in the environment this was built in, and the browser-automation tool used for interim verification introduces its own multi-second idle gaps between actions that the frame counter (correctly) records as fake "worst frame" spikes — those numbers aren't representative of anything and I'm not including them here to avoid presenting noise as a measurement. The mechanism above (layout animations firing on recycler-repositioned views) is a well-documented Reanimated + virtualized-list interaction, and the fix is straightforward to verify: enable the overlay, scroll continuously, and drop counts recorded during scroll should be attributable only to genuine jank elsewhere, not this pattern.

**To fill in before submitting**: run on the target device/emulator, tap "Reset session" on the overlay right before starting a clean continuous scroll, scroll for 60s, then record the before/after p50, p95, and drop count from the summary panel into the table below.

## Bottleneck: bottom sheet re-laying-out its whole content tree every animation frame

**Symptom**: visible frame drops opening and especially closing the Ask Crew sheet, worse than the feed-scroll case above.

**Root cause**: the sheet's outer box animated `height` directly while *directly containing* the real content (header, `FlatList` of chat messages, input) as normal flex children. Animating a layout-affecting property like `height` forces Yoga to re-layout that entire subtree on every frame of the spring animation — and `FlatList` reacts to its container resizing via `onLayout`, which round-trips to the JS thread on every one of those frames too. Closing was worse than opening because there's more already-rendered message history to keep re-flowing as the container shrinks.

**Fix**: split `BottomSheet` into two layers. An outer "viewport" is the *only* thing whose `height` is animated, and it has exactly one child: a static "card," absolutely positioned and fixed at `fullHeight`, holding the actual content. Because the card's own size never changes, Yoga lays out its subtree exactly once — the animated viewport is just clipping (`overflow: hidden`) and repositioning an already-sized box, not re-flowing anything. The card is anchored `top: 0` (tracking the viewport's animated top edge, not its bottom) so content reveals top-down as the sheet grows — anchoring it to `bottom: 0` was tried first and revealed content bottom-up instead (the header ended up clipped off-screen at anything less than full height, only the input visible). See `components/ui/BottomSheet.tsx`.

**Evidence**: same caveat as the feed-scroll bottleneck — no device/emulator available in this environment, and the web-preview automation tooling's own idle gaps pollute frame timing. Verify on-device: open/close/drag the sheet repeatedly with the overlay active and confirm the drop counter and worst-frame stay flat through the gesture.

## p50 / p95 frame time — 60s scroll session

| | p50 frame time | p95 frame time | Worst frame | Drops (<45fps) |
|---|---|---|---|---|
| Before fix | _fill in_ | _fill in_ | _fill in_ | _fill in_ |
| After fix | _fill in_ | _fill in_ | _fill in_ | _fill in_ |

_Methodology: enable the perf overlay, tap "Reset session," scroll continuously through the full feed for 60 seconds, expand the overlay's summary panel and record the four values above. Repeat on the same device/emulator for a fair before/after comparison._

## Honest trade-off

The custom bottom sheet (`components/ui/BottomSheet.tsx`, built after `@gorhom/bottom-sheet` turned out to be incompatible with Reanimated 4 / `react-native-worklets` on this stack) still animates **height**, not a pure `transform: translateY`. A pure transform is compositor-only and doesn't trigger a native layout pass at all, which is why the feed-scroll fix above specifically avoids animating layout-affecting properties on recycled cells — and it's also why I initially assumed animating height on the sheet was "fine, it's just one view." It wasn't (see the bottleneck above): a naive single-view height animation forced a full subtree re-layout, including `FlatList`'s JS-thread `onLayout` churn, every frame.

The viewport/card split fixes the *cost* of animating height (down to repositioning one already-sized box) but doesn't eliminate the fact that it's still a layout property, not a transform. I could chase a pure-transform version — it would need the "reveal from the top, clip the bottom" behavior to come from something other than an animated `overflow: hidden` height, which isn't straightforward with `transform` alone (a transform-only sheet would need per-line clipping or a shader-level mask, not standard RN styling). Given the fix already brought the cost down to "reposition one fixed-size box," I judged the remaining gap not worth the added complexity — this is the trade-off I'm making deliberately, not one I've fully closed.
