import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from "react";
import { Keyboard, Platform, StyleSheet, View, useWindowDimensions } from "react-native";
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
 * The sheet's visible box height is what's animated (bottom always pinned to
 * the screen edge), not a translateY on a fixed-height box — that keeps
 * content anchored to the bottom of the sheet (like the chat input) sitting
 * at the true visible bottom edge at every snap point, not just "full". This
 * costs a per-frame native layout pass during the drag instead of a pure
 * compositor-only transform, which is the right trade for a single sheet
 * view — it would matter if this were animating many recycled list cells
 * (see the feed-scroll fix), but for one view during an explicit gesture the
 * cost is negligible.
 */
export const BottomSheet = forwardRef<BottomSheetHandle, BottomSheetProps>(
  ({ children, halfRatio = 0.5, fullRatio = 0.92, keyboardAware = true }, ref) => {
    const { height: windowHeight } = useWindowDimensions();
    const fullHeight = windowHeight * fullRatio;
    const halfHeight = windowHeight * halfRatio;
    const closedHeight = 0;

    // sheetHeight is the sheet's current *visible* height. Animating height
    // directly (rather than translating a fixed-height box) keeps the box's
    // bottom edge pinned to the screen edge at every snap point.
    const sheetHeight = useSharedValue(closedHeight);
    const dragStartHeight = useSharedValue(closedHeight);
    const [isOpen, setIsOpen] = useState(false);
    const keyboard = useAnimatedKeyboard();

    const snapTo = useCallback(
      (snap: BottomSheetSnap) => {
        const target = snap === "closed" ? closedHeight : snap === "half" ? halfHeight : fullHeight;
        if (snap !== "closed") setIsOpen(true);
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

    const sheetStyle = useAnimatedStyle(() => ({
      height: sheetHeight.value,
    }));

    // Lift content by exactly the keyboard's current height, driven on the UI
    // thread in sync with the native keyboard show/hide animation curve.
    // KeyboardAvoidingView was tried first, but its self-measurement (it
    // measures its own position relative to the window to compute padding)
    // is unreliable nested inside a `position: absolute` view whose height is
    // itself being animated — it never produced correct padding here. Driving
    // the lift explicitly from the keyboard's own height sidesteps that.
    const keyboardLiftStyle = useAnimatedStyle(() => ({
      marginBottom: keyboardAware ? keyboard.height.value : 0,
    }));

    return (
      <Animated.View pointerEvents={isOpen ? "box-none" : "none"} style={[styles.sheet, sheetStyle]}>
        <GestureDetector gesture={panGesture}>
          <View style={styles.handleArea}>
            <View style={styles.handle} />
          </View>
        </GestureDetector>

        <Animated.View style={[styles.content, keyboardLiftStyle]}>{children}</Animated.View>
      </Animated.View>
    );
  }
);

BottomSheet.displayName = "BottomSheet";

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    backgroundColor: "#151517",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 60,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  handleArea: {
    paddingVertical: 8,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#4a4a4d",
  },
  content: {
    flex: 1,
  },
});
