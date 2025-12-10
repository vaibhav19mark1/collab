"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUIStore } from "@/stores/uiStore";
import { useChatStore } from "@/stores/chatStore";
import { useRoomChat } from "@/hooks/useRoomChat";
import axios from "axios";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type messageType = {
  messageId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
};

const RoomChat = ({ roomId }: { roomId: string }) => {
  const { data: session } = useSession();
  const userId = session?.user?._id || "";
  const chatOpen = useUIStore((state) => state.chatOpen);
  const toggleChat = useUIStore((state) => state.toggleChat);
  const messagesData = useChatStore((state) => state.messagesByRoom[roomId]);
  const messages = messagesData || [];
  const typingUsers =
    useChatStore((state) => state.typingUsersByRoom[roomId]) || [];
  const resetUnread = useChatStore((state) => state.resetUnread);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { handleTyping, stopTyping } = useRoomChat({
    roomId,
    userId,
    enabled: true,
  });

  const loadMessageHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const response = await axios.get(`/api/rooms/${roomId}/messages?take=50`);
      if (response.data.success) {
        // Ensure timestamps are Date objects
        const formattedMessages = response.data.messages.map(
          (msg: messageType) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            status: "sent",
          })
        );
        useChatStore.getState().setMessages(roomId, formattedMessages);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load message history");
    } finally {
      setIsLoadingHistory(false);
    }
  }, [roomId]);

  // Load message history on mount
  useEffect(() => {
    if (chatOpen && roomId) {
      loadMessageHistory();
      resetUnread(roomId);
    }
  }, [chatOpen, roomId, loadMessageHistory, resetUnread]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatOpen && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, chatOpen]);

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    const messageToSend = message.trim();
    setMessage("");
    setIsSending(true);
    stopTyping();

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      messageId: tempId,
      userId,
      username: session?.user?.name || "You",
      message: messageToSend,
      timestamp: new Date(),
      status: "sending" as const,
    };

    addMessage(roomId, optimisticMessage);

    try {
      const response = await axios.post(`/api/rooms/${roomId}/messages`, {
        message: messageToSend,
      });

      if (response.data.success && response.data.message) {
        // Update the optimistic message with real data
        updateMessage(roomId, tempId, {
          messageId: response.data.message.messageId,
          timestamp: new Date(response.data.message.timestamp),
          status: "sent",
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error
          : undefined;
      toast.error(errorMessage || "Failed to send message");
      // Mark as error
      updateMessage(roomId, tempId, {
        status: "error",
      });
      setMessage(messageToSend); // Restore message on error so user can retry
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (e.target.value.trim()) {
      handleTyping();
    } else {
      stopTyping();
    }
  };

  if (!chatOpen) return null;

  return (
    <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 sm:w-96 bg-background border-l border-border flex flex-col z-40 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 backdrop-blur-sm">
        <div>
          <h3 className="font-semibold text-lg">Chat</h3>
          <p className="text-xs text-muted-foreground">
            {messages.length} messages
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleChat}
          className="h-8 w-8 rounded-full hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-2 text-center opacity-50">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Send className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-sm text-muted-foreground">
              No messages yet.
              <br />
              Start the conversation!
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.userId === userId;
            return (
              <div
                key={msg.messageId}
                className={`flex gap-3 ${
                  isOwnMessage ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium text-white shadow-sm ${
                      isOwnMessage
                        ? "bg-primary"
                        : "bg-blue-500"
                    }`}
                  >
                    {msg.username.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* Message Bubble */}
                <div
                  className={`flex flex-col max-w-[75%] ${
                    isOwnMessage ? "items-end" : "items-start"
                  }`}
                >
                  {!isOwnMessage && (
                    <span className="text-xs font-medium text-foreground mb-1 ml-1">
                      {msg.username}
                    </span>
                  )}

                  <div
                    className={`px-3 py-2 text-sm min-w-[120px] inline-block ${
                      isOwnMessage
                        ? "bg-primary text-primary-foreground rounded-lg rounded-tr-sm"
                        : "bg-muted text-foreground rounded-lg rounded-tl-sm"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words break-all leading-relaxed">
                      {msg.message}
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <span
                        className={`text-[10px] whitespace-nowrap ${
                          isOwnMessage
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatDistanceToNow(new Date(msg.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                      {isOwnMessage && (
                        <span>
                          {msg.status === "sending" && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                          {msg.status === "sent" && (
                            <span className="text-[10px]">✓</span>
                          )}
                          {msg.status === "error" && (
                            <span className="text-red-300">!</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/30 border-t border-border/50 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"></span>
            </div>
            <span>
              {typingUsers.length === 1
                ? `${typingUsers[0].username} is typing...`
                : `${typingUsers.length} people are typing...`}
            </span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-background border-t border-border">
        <div className="relative flex items-center gap-2 bg-muted/30 px-2 py-1 rounded-xl border border-input focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-all">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[40px] max-h-[120px] w-full shadow-none resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-2.5 text-sm placeholder:text-muted-foreground"
            disabled={isSending}
            maxLength={500}
            rows={1}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending}
            size="icon"
            variant="ghost"
            className={`h-8 w-8 shrink-0 rounded-full transition-all hover:bg-background ${
              message.trim() ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export { RoomChat };

export default RoomChat;
