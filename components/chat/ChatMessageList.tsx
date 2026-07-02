import { useEffect, useRef } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useChatStore, type ChatMessage } from "@/store/chatStore";
import { ChatBubble } from "./ChatBubble";

function renderItem({ item }: { item: ChatMessage }) {
  return <ChatBubble message={item} />;
}

function keyExtractor(item: ChatMessage) {
  return item.id;
}

export function ChatMessageList() {
  const messages = useChatStore((s) => s.messages);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const lastMessageText = messages[messages.length - 1]?.text;

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages.length, lastMessageText]);

  if (messages.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Ask Crew anything</Text>
        <Text style={styles.emptySubtitle}>
          Try &quot;any villas under $2000?&quot; or &quot;what&apos;s the weather like in Kyoto?&quot;
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={messages}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    />
  );
}

// Chat input now floats as its own layer above this list (see BottomSheet's
// `footer` prop), so content needs enough bottom clearance to not render
// underneath it at any snap point.
const FOOTER_CLEARANCE = 88;

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: FOOTER_CLEARANCE,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: FOOTER_CLEARANCE,
    gap: 6,
  },
  emptyTitle: {
    color: "#e8e8ea",
    fontSize: 16,
    fontWeight: "700",
  },
  emptySubtitle: {
    color: "#8e8e93",
    fontSize: 13,
    textAlign: "center",
  },
});
