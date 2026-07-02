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

## p50 / p95 frame time — 60s scroll session

| | p50 frame time | p95 frame time | Worst frame | Drops (<45fps) |
|---|---|---|---|---|
| Before fix | _fill in_ | _fill in_ | _fill in_ | _fill in_ |
| After fix | _fill in_ | _fill in_ | _fill in_ | _fill in_ |

_Methodology: enable the perf overlay, tap "Reset session," scroll continuously through the full feed for 60 seconds, expand the overlay's summary panel and record the four values above. Repeat on the same device/emulator for a fair before/after comparison._

## Honest trade-off

The custom bottom sheet (`components/ui/BottomSheet.tsx`, built after `@gorhom/bottom-sheet` turned out to be incompatible with Reanimated 4 / `react-native-worklets` on this stack — its percentage snap-point math depends on a container-height shared value that never resolves, so the sheet mounts but never animates) animates the sheet's **height** directly, not a `transform: translateY` on a fixed-height box.

A pure transform is compositor-only and doesn't trigger a native layout pass, which is why the feed-scroll fix above specifically avoids animating layout-affecting properties on recycled cells. I considered the same approach here — translate a fixed-height box instead of animating height — but it has a real geometry problem: content anchored to the *bottom* of a fixed-height box (like the chat input, which must always sit at the visible bottom edge) ends up positioned off the visible box entirely at anything less than "full" height, since the box's layout bottom moves with the translate. Animating `height` keeps the box's bottom pinned to the screen edge at every snap point, so the input is always where it should be.

The trade-off: this costs a native layout pass on the UI thread on every frame of the drag gesture, instead of a compositor-only transform. For a single view during an explicit user gesture, that cost is negligible — it would only matter at the scale of the feed-scroll problem above, where the same pattern applied to *dozens of simultaneously recycled cells* is what caused visible drops. Correctness (input always reachable) won over the theoretically-cheaper approach here.
