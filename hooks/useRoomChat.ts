import { useEffect, useCallback, useRef } from "react";
import { useSocket } from "./useSocket";
import type {
  ChatMessagePayload,
  ChatTypingPayload,
} from "@/types/socket.types";
import { useUIStore } from "@/stores/uiStore";
import { useChatStore } from "@/stores/chatStore";

interface UseRoomChatOptions {
  roomId: string;
  userId: string;
  enabled?: boolean;
}

export function useRoomChat({
  roomId,
  userId,
  enabled = true,
}: UseRoomChatOptions) {
  const { socket, isConnected, emit, on, off } = useSocket();
  const addMessage = useChatStore((state) => state.addMessage);
  const setTypingUser = useChatStore((state) => state.setTypingUser);
  const chatOpen = useUIStore((state) => state.chatOpen);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // handles incoming chat messages
  useEffect(() => {
    if (!socket || !enabled) return;

    const handleChatMessage = (payload: ChatMessagePayload) => {

      // Add message to store
      addMessage(roomId, {
        messageId: payload.messageId,
        userId: payload.userId,
        username: payload.username,
        message: payload.message,
        timestamp: new Date(payload.timestamp),
      });

      // Increment unread if chat is closed and not own message
      if (!chatOpen && payload.userId !== userId) {
        useChatStore.getState().incrementUnread(roomId);
      }
    };

    on("chat:message", handleChatMessage);
    return () => off("chat:message", handleChatMessage);
  }, [socket, enabled, roomId, userId, chatOpen, addMessage, on, off]);

  // handles typing indicators
  useEffect(() => {
    if (!socket || !enabled) return;

    const handleTyping = (payload: ChatTypingPayload) => {
      // Don't show own typing indicator
      if (payload.userId === userId) return;

      setTypingUser(roomId, payload.userId, payload.username, payload.isTyping);

      // Clear existing timeout for this user
      if (typingTimeoutsRef.current.has(payload.userId)) {
        clearTimeout(typingTimeoutsRef.current.get(payload.userId)!);
        typingTimeoutsRef.current.delete(payload.userId);
      }

      // If user is typing, set a fallback timeout to clear it
      if (payload.isTyping) {
        const timeout = setTimeout(() => {
          setTypingUser(roomId, payload.userId, payload.username, false);
          typingTimeoutsRef.current.delete(payload.userId);
        }, 5000); // 5 seconds fallback (longer than sender's throttle)
        typingTimeoutsRef.current.set(payload.userId, timeout);
      }
    };

    on("chat:typing", handleTyping);
    return () => {
      off("chat:typing", handleTyping);
      // Clear all pending timeouts on unmount/re-run
      typingTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeoutsRef.current.clear();
    };
  }, [socket, enabled, roomId, userId, setTypingUser, on, off]);

  // Cleanup sender timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Send typing indicator
  const sendTypingIndicator = useCallback(
    (isTyping: boolean) => {
      if (!isConnected || !enabled) return;

      emit("chat:typing", { roomId, isTyping });
    },
    [isConnected, enabled, roomId, emit]
  );

  // debounced typing handler
  const handleTyping = useCallback(() => {
    const now = Date.now();

    // Throttle sending "true" every 2 seconds
    if (now - lastTypingSentRef.current > 2000) {
      sendTypingIndicator(true);
      lastTypingSentRef.current = now;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Debounce sending "false" (stop typing)
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
      lastTypingSentRef.current = 0; // Reset throttle
    }, 3000);
  }, [sendTypingIndicator]);

  // stop typing handler
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    sendTypingIndicator(false);
    lastTypingSentRef.current = 0;
  }, [sendTypingIndicator]);

  return {
    handleTyping,
    stopTyping,
  };
}
