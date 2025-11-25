interface ParticipantJoinedPayload {
  roomId: string;
  participant: {
    userId: string;
    username: string;
    role: "owner" | "admin" | "member";
    joinedAt: Date;
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
}

interface ParticipantBannedPayload {
  roomId: string;
  bannedUserId: string;
  bannedUsername: string;
  bannedBy: string;
  bannedByUsername: string;
  reason?: string;
}

interface ParticipantUnbannedPayload {
  roomId: string;
  unbannedUserId: string;
  unbannedUsername: string;
  unbannedBy: string;
  unbannedByUsername: string;
}

interface ParticipantRoleChangedPayload {
  roomId: string;
  userId: string;
  username: string;
  oldRole: "owner" | "admin" | "member";
  newRole: "owner" | "admin" | "member";
  changedBy: string;
  changedByUsername: string;
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
}

interface ClientToServerEvents {
  "room:join": (roomId: string) => void;
  "room:leave": (roomId: string) => void;
}

export type {
  ServerToClientEvents,
  ClientToServerEvents,
  ParticipantJoinedPayload,
  ParticipantLeftPayload,
  ParticipantKickedPayload,
  ParticipantBannedPayload,
  ParticipantUnbannedPayload,
  ParticipantRoleChangedPayload,
  RoomSettingsUpdatedPayload,
  RoomDeletedPayload,
};
