import { InviteStatus } from "@/types/room.types";
import mongoose, { Document, Schema, Types } from "mongoose";

export interface Invite extends Document {
  _id: Types.ObjectId;
  roomId: string;
  roomName: string;
  token: string;
  inviterId: string; // user who created the invite
  inviterUsername: string;
  inviteeEmail?: string;
  status: InviteStatus;
  expiresAt: Date;
  acceptedAt?: Date;
  acceptedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const inviteSchema = new Schema<Invite>(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    roomName: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    inviterId: {
      type: String,
      required: true,
      index: true,
    },
    inviterUsername: {
      type: String,
      required: true,
    },
    inviteeEmail: {
      type: String,
      index: true,
      sparse: true, // Allow null values but index non-null
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired", "revoked"],
      default: "pending",
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    acceptedAt: {
      type: Date,
    },
    acceptedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

inviteSchema.methods.isValid = function (): boolean {
  return this.status === "pending" && this.expiresAt > new Date();
};

const Invite =
  mongoose.models.Invite || mongoose.model<Invite>("Invite", inviteSchema);

export default Invite;
