interface ParticipantJoinedPayload {
  roomId: string;
  participant: {
    userId: string;
    username: string;
    role: "owner" | "admin" | "member";
    joinedAt: Date;
    color: string;
    avatar?: string;
  };
}

interface ParticipantLeftPayload {
  roomId: string;
  userId: string;
  username: string;
}

interface ParticipantKickedPayload {
  roomId: string;
  kickedUserId: string;
  kickedUsername: string;
  kickedBy: string;
  kickedByUsername: string;
  performedBy?: string; // ID of the user who performed the action
}

interface ParticipantBannedPayload {
  roomId: string;
  bannedUserId: string;
  bannedUsername: string;
  bannedBy: string;
  bannedByUsername: string;
  reason?: string;
  performedBy?: string; // ID of the user who performed the action
}

interface ParticipantUnbannedPayload {
  roomId: string;
  unbannedUserId: string;
  unbannedUsername: string;
  unbannedBy: string;
  unbannedByUsername: string;
  performedBy?: string; // ID of the user who performed the action
}

interface ParticipantRoleChangedPayload {
  roomId: string;
  userId: string;
  username: string;
  oldRole: "owner" | "admin" | "member";
  newRole: "owner" | "admin" | "member";
  changedBy: string;
  changedByUsername: string;
  performedBy?: string; // ID of the user who performed the action
}

interface RoomSettingsUpdatedPayload {
  roomId: string;
  updatedBy: string;
  updatedByUsername: string;
  updates: {
    name?: string;
    description?: string;
    maxParticipants?: number;
    isPrivate?: boolean;
    hasPassword?: boolean;
  };
}

interface RoomDeletedPayload {
  roomId: string;
  deletedBy: string;
  deletedByUsername: string;
  performedBy?: string; // ID of the user who performed the action
}

interface ChatMessagePayload {
  roomId: string;
  messageId: string;
  userId: string;
  username: string;
  avatar?: string;
  message: string;
  timestamp: Date;
}

interface ChatTypingPayload {
  roomId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

// Socket event types
interface ServerToClientEvents {
  "participant:joined": (payload: ParticipantJoinedPayload) => void;
  "participant:left": (payload: ParticipantLeftPayload) => void;
  "participant:kicked": (payload: ParticipantKickedPayload) => void;
  "participant:banned": (payload: ParticipantBannedPayload) => void;
  "participant:unbanned": (payload: ParticipantUnbannedPayload) => void;
  "participant:role_changed": (payload: ParticipantRoleChangedPayload) => void;
  "room:settings_updated": (payload: RoomSettingsUpdatedPayload) => void;
  "room:deleted": (payload: RoomDeletedPayload) => void;
  "chat:message": (payload: ChatMessagePayload) => void;
  "chat:typing": (payload: ChatTypingPayload) => void;
}

interface ClientToServerEvents {
  "room:join": (
    roomId: string,
    userData?: { userId: string; username: string }
  ) => void;
  "room:leave": (roomId: string) => void;
  "chat:send_message": (payload: { roomId: string; message: string }) => void;
  "chat:typing": (payload: { roomId: string; isTyping: boolean }) => void;
}

export type {
  // socket events
  ServerToClientEvents,
  ClientToServerEvents,
  // room
  ParticipantJoinedPayload,
  ParticipantLeftPayload,
  ParticipantKickedPayload,
  ParticipantBannedPayload,
  ParticipantUnbannedPayload,
  ParticipantRoleChangedPayload,
  RoomSettingsUpdatedPayload,
  RoomDeletedPayload,
  // chat
  ChatMessagePayload,
  ChatTypingPayload,
};
