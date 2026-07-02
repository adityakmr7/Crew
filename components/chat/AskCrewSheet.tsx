import { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BottomSheet, type BottomSheetHandle } from "@/components/ui/BottomSheet";
import { ChatInput } from "./ChatInput";
import { ChatMessageList } from "./ChatMessageList";

export const AskCrewSheet = forwardRef<BottomSheetHandle>((_props, ref) => {
  return (
    <BottomSheet ref={ref}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ask Crew</Text>
        <Text style={styles.headerSubtitle}>Your AI travel assistant</Text>
      </View>
      <View style={styles.body}>
        <ChatMessageList />
      </View>
      <ChatInput />
    </BottomSheet>
  );
});

AskCrewSheet.displayName = "AskCrewSheet";

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2a2d",
  },
  headerTitle: {
    color: "#f2f2f3",
    fontSize: 17,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#8e8e93",
    fontSize: 12,
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
});
