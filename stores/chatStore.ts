import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface ChatMessage {
  messageId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  status?: "sending" | "sent" | "error";
}

interface TypingUser {
  userId: string;
  username: string;
}

interface ChatState {
  messagesByRoom: Record<string, ChatMessage[]>; // messages by room ID
  typingUsersByRoom: Record<string, TypingUser[]>; // typing users by room ID
  unreadCountsByRoom: Record<string, number>; // unread counts by room ID

  // actions
  addMessage: (roomId: string, message: ChatMessage) => void;
  updateMessage: (
    roomId: string,
    messageId: string,
    updates: Partial<ChatMessage>
  ) => void;
  setMessages: (roomId: string, messages: ChatMessage[]) => void;
  clearMessages: (roomId: string) => void;

  setTypingUser: (
    roomId: string,
    userId: string,
    username: string,
    isTyping: boolean
  ) => void;
  clearTypingUsers: (roomId: string) => void;

  incrementUnread: (roomId: string) => void;
  resetUnread: (roomId: string) => void;

  reset: () => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    (set) => ({
      messagesByRoom: {},
      typingUsersByRoom: {},
      unreadCountsByRoom: {},

      addMessage: (roomId, message) =>
        set((state) => {
          const roomMessages = state.messagesByRoom[roomId] || [];
          // If message with same ID exists, don't add duplicate
          if (roomMessages.some((m) => m.messageId === message.messageId)) {
            return state;
          }
          return {
            messagesByRoom: {
              ...state.messagesByRoom,
              [roomId]: [...roomMessages, message],
            },
          };
        }),

      updateMessage: (roomId, messageId, updates) =>
        set((state) => {
          const roomMessages = state.messagesByRoom[roomId] || [];
          return {
            messagesByRoom: {
              ...state.messagesByRoom,
              [roomId]: roomMessages.map((msg) =>
                msg.messageId === messageId ? { ...msg, ...updates } : msg
              ),
            },
          };
        }),

      setMessages: (roomId, messages) =>
        set((state) => ({
          messagesByRoom: {
            ...state.messagesByRoom,
            [roomId]: messages,
          },
        })),

      clearMessages: (roomId) =>
        set((state) => {
          const newMessages = { ...state.messagesByRoom };
          delete newMessages[roomId];
          return { messagesByRoom: newMessages };
        }),

      setTypingUser: (roomId, userId, username, isTyping) =>
        set((state) => {
          const currentTyping = state.typingUsersByRoom[roomId] || [];
          let newTyping: TypingUser[];

          if (isTyping) {
            // add user if not already typing
            if (!currentTyping.some((u) => u.userId === userId)) {
              newTyping = [...currentTyping, { userId, username }];
            } else {
              newTyping = currentTyping;
            }
          } else {
            newTyping = currentTyping.filter((u) => u.userId !== userId);
          }

          return {
            typingUsersByRoom: {
              ...state.typingUsersByRoom,
              [roomId]: newTyping,
            },
          };
        }),

      clearTypingUsers: (roomId) =>
        set((state) => ({
          typingUsersByRoom: {
            ...state.typingUsersByRoom,
            [roomId]: [],
          },
        })),

      incrementUnread: (roomId) =>
        set((state) => ({
          unreadCountsByRoom: {
            ...state.unreadCountsByRoom,
            [roomId]: (state.unreadCountsByRoom[roomId] || 0) + 1,
          },
        })),

      resetUnread: (roomId) =>
        set((state) => ({
          unreadCountsByRoom: {
            ...state.unreadCountsByRoom,
            [roomId]: 0,
          },
        })),

      reset: () =>
        set({
          messagesByRoom: {},
          typingUsersByRoom: {},
          unreadCountsByRoom: {},
        }),
    }),
    { name: "ChatStore" }
  )
);
