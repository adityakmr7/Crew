import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useChatStore } from "@/store/chatStore";

export function ChatInput() {
  const [value, setValue] = useState("");
  const sendMessage = useChatStore((s) => s.sendMessage);

  const handleSend = () => {
    if (!value.trim()) return;
    sendMessage(value);
    setValue("");
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="Ask about destinations, prices, dates..."
        placeholderTextColor="#6a6a6d"
        style={styles.input}
        multiline
        onSubmitEditing={handleSend}
        returnKeyType="send"
      />
      <Pressable
        onPress={handleSend}
        disabled={!value.trim()}
        style={[styles.sendButton, !value.trim() && styles.sendButtonDisabled]}
      >
        <Ionicons name="arrow-up" size={18} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#151517",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#2a2a2d",
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: "#1c1c1e",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#f2f2f3",
    fontSize: 15,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3a7bd5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: "#3a3a3d",
  },
});
