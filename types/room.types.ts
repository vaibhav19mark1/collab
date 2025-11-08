export type ParticipantRole = "owner" | "admin" | "member";

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
  isPrivate: boolean;
  hasPassword: boolean;
  maxParticipants: number;
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type RoomFilter = "all" | "owned" | "joined";
