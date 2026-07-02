import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ChatMessage } from "@/store/chatStore";

interface ChatBubbleProps {
  message: ChatMessage;
}

function ChatBubbleBase({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        {message.text.length === 0 && message.isStreaming ? (
          <View style={styles.typingDots}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        ) : (
          <Text style={[styles.text, isUser ? styles.textUser : styles.textAssistant]}>
            {message.text}
            {message.isStreaming && message.text.length > 0 ? " ▍" : ""}
          </Text>
        )}
      </View>
    </View>
  );
}

function areEqual(prev: ChatBubbleProps, next: ChatBubbleProps) {
  return (
    prev.message.id === next.message.id &&
    prev.message.text === next.message.text &&
    prev.message.isStreaming === next.message.isStreaming
  );
}

export const ChatBubble = memo(ChatBubbleBase, areEqual);

const styles = StyleSheet.create({
  row: {
    width: "100%",
    marginVertical: 5,
    flexDirection: "row",
  },
  rowUser: {
    justifyContent: "flex-end",
  },
  rowAssistant: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: "#3a7bd5",
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: "#232326",
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  textUser: {
    color: "#fff",
  },
  textAssistant: {
    color: "#e8e8ea",
  },
  typingDots: {
    flexDirection: "row",
    gap: 4,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#8e8e93",
  },
});
