import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from "react";
import { Keyboard, Platform, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  clamp,
  runOnJS,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const SPRING_CONFIG = { damping: 28, stiffness: 260, mass: 0.9 };
const HANDLE_TRACK_HEIGHT = 28;

export type BottomSheetSnap = "closed" | "half" | "full";

export interface BottomSheetHandle {
  /** Opens to the half-height (peek) snap point. */
  open: () => void;
  /** Opens directly to full height. */
  openFull: () => void;
  close: () => void;
  snapTo: (snap: BottomSheetSnap) => void;
}

interface BottomSheetProps {
  children: React.ReactNode;
  /** Persistent content pinned to the sheet's true bottom edge at every snap point (e.g. a chat input). */
  footer?: React.ReactNode;
  /** Fraction of window height for the peek snap point. Defaults to 0.5. */
  halfRatio?: number;
  /** Fraction of window height for the full snap point. Defaults to 0.92. */
  fullRatio?: number;
  /** Lift content above the keyboard and auto-expand to full height when it opens. Defaults to true. */
  keyboardAware?: boolean;
}

/**
 * Reusable draggable bottom sheet built directly on Reanimated + Gesture Handler.
 *
 * Exists because @gorhom/bottom-sheet does not currently work with
 * react-native-reanimated 4 / react-native-worklets (its percentage snap-point
 * math depends on a container-height shared value that never resolves on this
 * stack, so the sheet mounts but never animates open). This component only
 * depends on APIs Reanimated 4 fully supports, so it isn't affected.
 *
 * Structure is deliberately three layers, not one:
 *   - a "viewport" that's the only thing whose `height` is animated (open,
 *     close, and drag all just move this one number), with `overflow: hidden`
 *     and exactly one absolutely-positioned child;
 *   - a static "card" inside it, fixed at `fullHeight` and never resized,
 *     holding `children` (e.g. header + message list) — anchored `top: 0` so
 *     it tracks the viewport's animated top edge and reveals content top-down
 *     as the sheet grows;
 *   - a separate `footer` layer (e.g. the chat input), pinned to the sheet's
 *     true bottom edge independently of the card. This exists because the
 *     card is fixed at `fullHeight`: content inside it laid out normally
 *     (flex column, footer-like elements at the bottom) ends up positioned at
 *     the *card's* bottom, which is `fullHeight` below the card's top and
 *     therefore outside the viewport's clip window at anything less than
 *     "full" — the input would be invisible at "half". Rendering it as its
 *     own layer, pinned to the viewport's bottom (which is always the true
 *     screen edge, unlike the card's bottom), keeps it visible and reachable
 *     at every snap point.
 * A single view animating `height` while directly containing all of this as
 * normal flex children forces Yoga to re-layout the whole subtree every
 * frame, and a `FlatList` inside reacts to its container resizing via
 * `onLayout`, which round-trips to the JS thread on every frame too — that
 * combination is what caused visible frame drops on open/close, worse while
 * closing since there's more already-rendered content to keep re-flowing as
 * it shrinks. Because the card is absolutely positioned with a fixed height,
 * Yoga doesn't need to touch its subtree at all when the viewport resizes —
 * it's laid out once and never again.
 */
export const BottomSheet = forwardRef<BottomSheetHandle, BottomSheetProps>(
  ({ children, footer, halfRatio = 0.5, fullRatio = 0.92, keyboardAware = true }, ref) => {
    const { height: windowHeight } = useWindowDimensions();
    const fullHeight = windowHeight * fullRatio;
    const halfHeight = windowHeight * halfRatio;
    const closedHeight = 0;

    // sheetHeight is the viewport's current *visible* height — the only
    // animated layout value in this component.
    const sheetHeight = useSharedValue(closedHeight);
    const dragStartHeight = useSharedValue(closedHeight);
    const [isOpen, setIsOpen] = useState(false);
    const keyboard = useAnimatedKeyboard();

    const snapTo = useCallback(
      (snap: BottomSheetSnap) => {
        const target = snap === "closed" ? closedHeight : snap === "half" ? halfHeight : fullHeight;
        if (snap !== "closed") setIsOpen(true);
        if (snap === "closed") Keyboard.dismiss();
        sheetHeight.value = withSpring(target, SPRING_CONFIG, (finished) => {
          if (finished && snap === "closed") {
            runOnJS(setIsOpen)(false);
          }
        });
      },
      [sheetHeight, closedHeight, halfHeight, fullHeight]
    );

    useImperativeHandle(
      ref,
      () => ({
        open: () => snapTo("half"),
        openFull: () => snapTo("full"),
        close: () => snapTo("closed"),
        snapTo,
      }),
      [snapTo]
    );

    // Grow to full height the moment the keyboard opens, whatever the current
    // snap point. Without this, at "half" the keyboard (often 300-350pt) can
    // leave less room than the header + input need, and the keyboard-height
    // lift below just squeezes everything into that too-small remainder —
    // clipped by the sheet's own `overflow: hidden` instead of pushed above
    // the keyboard. Expanding first guarantees there's room for the lift to
    // work with.
    useEffect(() => {
      if (!keyboardAware) return;
      const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
      const subscription = Keyboard.addListener(showEvent, () => {
        if (sheetHeight.value > 0) {
          snapTo("full");
        }
      });
      return () => subscription.remove();
    }, [keyboardAware, snapTo, sheetHeight]);

    const panGesture = Gesture.Pan()
      .onStart(() => {
        dragStartHeight.value = sheetHeight.value;
      })
      .onUpdate((event) => {
        // Dragging up (negative translationY) grows the sheet.
        sheetHeight.value = clamp(dragStartHeight.value - event.translationY, closedHeight, fullHeight);
      })
      .onEnd((event) => {
        const projected = sheetHeight.value - event.velocityY * 0.15;
        const candidates: { snap: BottomSheetSnap; height: number }[] = [
          { snap: "closed", height: closedHeight },
          { snap: "half", height: halfHeight },
          { snap: "full", height: fullHeight },
        ];
        const nearest = candidates.reduce((best, candidate) =>
          Math.abs(candidate.height - projected) < Math.abs(best.height - projected) ? candidate : best
        );
        runOnJS(snapTo)(nearest.snap);
      });

    const viewportStyle = useAnimatedStyle(() => ({
      height: sheetHeight.value,
    }));

    // Tracks the current top edge of the visible sheet so the drag handle
    // always sits right there, regardless of snap point — a tiny view with
    // no meaningful subtree, so animating its position every frame is cheap
    // (unlike animating the card itself).
    const handleTrackStyle = useAnimatedStyle(() => ({
      bottom: sheetHeight.value - HANDLE_TRACK_HEIGHT,
    }));

    const backdropStyle = useAnimatedStyle(() => ({
      opacity: halfHeight > 0 ? Math.min(sheetHeight.value / halfHeight, 1) * 0.5 : 0,
    }));

    // Lift the footer by exactly the keyboard's current height, driven on
    // the UI thread in sync with the native keyboard show/hide animation
    // curve. KeyboardAvoidingView was tried first, but its self-measurement
    // (it measures its own position relative to the window to compute
    // padding) is unreliable nested inside a `position: absolute` view whose
    // height is itself being animated — it never produced correct padding
    // here. Driving the lift explicitly from the keyboard's own height
    // sidesteps that. Also fades the footer in/out over the first bit of the
    // open/close animation, so it doesn't just sit there once the rest of
    // the sheet has visually shrunk away.
    const footerStyle = useAnimatedStyle(() => ({
      bottom: keyboardAware ? keyboard.height.value : 0,
      opacity: clamp(sheetHeight.value / (HANDLE_TRACK_HEIGHT * 2), 0, 1),
    }));

    return (
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <Animated.View pointerEvents={isOpen ? "auto" : "none"} style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => snapTo("closed")} />
        </Animated.View>

        <Animated.View pointerEvents="box-none" style={[styles.viewport, viewportStyle]}>
          <View style={[styles.card, { height: fullHeight }]}>
            <View style={styles.content}>{children}</View>
          </View>
        </Animated.View>

        {footer && (
          <Animated.View pointerEvents={isOpen ? "auto" : "none"} style={[styles.footer, footerStyle]}>
            {footer}
          </Animated.View>
        )}

        <GestureDetector gesture={panGesture}>
          <Animated.View
            pointerEvents={isOpen ? "auto" : "none"}
            style={[styles.handleTrack, handleTrackStyle]}
          >
            <View style={styles.handle} />
          </Animated.View>
        </GestureDetector>
      </View>
    );
  }
);

BottomSheet.displayName = "BottomSheet";

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    zIndex: 55,
  },
  viewport: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    zIndex: 60,
  },
  card: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: "#151517",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  handleTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    height: HANDLE_TRACK_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 61,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#4a4a4d",
  },
  content: {
    flex: 1,
    paddingTop: HANDLE_TRACK_HEIGHT,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 62,
  },
});
