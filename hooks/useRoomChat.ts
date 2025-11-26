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
  const { addMessage, setTypingUser } = useChatStore((state) => ({
    addMessage: state.addMessage,
    setTypingUser: state.setTypingUser,
  }));
  const chatOpen = useUIStore((state) => state.chatOpen);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // handles incoming chat messages
  useEffect(() => {
    if (!socket || !enabled) return;

    const handleChatMessage = (payload: ChatMessagePayload) => {
      console.log("[CLIENT] Received chat:message:", payload);

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
      console.log("[CLIENT] Received chat:typing:", payload);

      // Don't show own typing indicator
      if (payload.userId === userId) return;

      setTypingUser(roomId, payload.userId, payload.username, payload.isTyping);

      // Auto-clear typing indicator after 3 seconds
      if (payload.isTyping) {
        setTimeout(() => {
          setTypingUser(roomId, payload.userId, payload.username, false);
        }, 3000);
      }
    };

    on("chat:typing", handleTyping);
    return () => off("chat:typing", handleTyping);
  }, [socket, enabled, roomId, userId, setTypingUser, on, off]);

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
    sendTypingIndicator(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
    }, 2000);
  }, [sendTypingIndicator]);

  // stop typing handler
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    sendTypingIndicator(false);
  }, [sendTypingIndicator]);

  return {
    handleTyping,
    stopTyping,
  };
}
