export type ParticipantRole = "owner" | "admin" | "member";

export interface BannedUser {
  userId: string;
  username: string;
  bannedAt: Date;
  bannedBy: string;
  reason?: string;
}

export interface Participant {
  userId: string;
  username: string;
  role: ParticipantRole;
  joinedAt: Date;
  color?: string;
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

//! invite types

export type InviteStatus = "pending" | "accepted" | "expired" | "revoked";

export interface Invite {
  _id: string;
  roomId: string;
  roomName: string;
  token: string;
  inviterId: string;
  inviterUsername: string;
  inviteeEmail?: string;
  status: InviteStatus;
  expiresAt: Date;
  acceptedAt?: Date;
  acceptedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
