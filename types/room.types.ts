export type ParticipantRole = "owner" | "admin" | "member";

export interface Participant {
  userId: string;
  username: string;
  role: ParticipantRole;
  joinedAt: Date;
}

export interface BannedUser {
  userId: string;
  username: string;
  bannedAt: Date;
  bannedBy: string;
  reason?: string;
}

// client side types
export interface Participant {
  userId: string;
  username: string;
  role: ParticipantRole;
  joinedAt: Date;
}

export interface Room {
  _id: string;
  name: string;
  description?: string;
  roomCode: string;
  owner: string;
  participants: Participant[];
  bannedUsers: BannedUser[];
  isPrivate: boolean;
  hasPassword: boolean;
  maxParticipants: number;
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type RoomFilter = "all" | "owned" | "joined";
