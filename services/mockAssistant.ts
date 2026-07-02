import { getMockResponse } from "@/data/mockChat";

const INITIAL_DELAY_MS = 650;
const TOKEN_DELAY_MIN_MS = 25;
const TOKEN_DELAY_MAX_MS = 55;

interface StreamAssistantOptions {
  onToken: (tokenSoFar: string) => void;
  onDone: (fullText: string) => void;
}

/**
 * Simulates a token-by-token streaming response (per the assignment's mock-data
 * constraint: no real Anthropic streaming required). Returns a cancel function
 * so an unmounted/closed chat doesn't keep writing to state.
 */
export function streamAssistantResponse(
  userMessage: string,
  { onToken, onDone }: StreamAssistantOptions
): () => void {
  let cancelled = false;
  const fullText = getMockResponse(userMessage);
  const words = fullText.split(" ");

  const initialTimer = setTimeout(() => {
    if (cancelled) return;
    let accumulated = "";
    let index = 0;

    const emitNext = () => {
      if (cancelled) return;
      accumulated += (index === 0 ? "" : " ") + words[index];
      index += 1;
      onToken(accumulated);

      if (index < words.length) {
        const delay = TOKEN_DELAY_MIN_MS + Math.random() * (TOKEN_DELAY_MAX_MS - TOKEN_DELAY_MIN_MS);
        tokenTimer = setTimeout(emitNext, delay);
      } else {
        onDone(accumulated);
      }
    };

    emitNext();
  }, INITIAL_DELAY_MS);

  let tokenTimer: ReturnType<typeof setTimeout> | null = null;

  return () => {
    cancelled = true;
    clearTimeout(initialTimer);
    if (tokenTimer) clearTimeout(tokenTimer);
  };
}
