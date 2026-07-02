import { create } from "zustand";
import { streamAssistantResponse } from "@/services/mockAssistant";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  isStreaming: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  isWaitingForFirstToken: boolean;
  sendMessage: (text: string) => void;
}

let activeCancel: (() => void) | null = null;
let nextId = 0;
const genId = () => `msg-${Date.now()}-${nextId++}`;

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isWaitingForFirstToken: false,

  sendMessage: (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    activeCancel?.();

    const userMessage: ChatMessage = { id: genId(), role: "user", text: trimmed, isStreaming: false };
    const assistantId = genId();
    const assistantMessage: ChatMessage = { id: assistantId, role: "assistant", text: "", isStreaming: true };

    set((s) => ({
      messages: [...s.messages, userMessage, assistantMessage],
      isWaitingForFirstToken: true,
    }));

    activeCancel = streamAssistantResponse(trimmed, {
      onToken: (tokenSoFar) => {
        set((s) => ({
          isWaitingForFirstToken: false,
          messages: s.messages.map((m) =>
            m.id === assistantId ? { ...m, text: tokenSoFar } : m
          ),
        }));
      },
      onDone: (fullText) => {
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === assistantId ? { ...m, text: fullText, isStreaming: false } : m
          ),
        }));
        activeCancel = null;
      },
    });
  },
}));
