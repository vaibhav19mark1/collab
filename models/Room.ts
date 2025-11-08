import mongoose, { Document, Schema, Types } from "mongoose";

export interface Participant {
  userId: string;
  username: string;
  role: "owner" | "admin" | "member";
  joinedAt: Date;
}

export interface Room extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  roomCode: string;
  password?: string;
  owner: string;
  participants: Participant[];
  isPrivate: boolean;
  maxParticipants: number;
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
  isParticipant: (userId: string) => boolean;
  isOwner: (userId: string) => boolean;
  getParticipantRole: (userId: string) => "owner" | "admin" | "member" | null;
}

const participantSchema = new Schema<Participant>(
  {
    userId: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      default: "member",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const roomSchema = new Schema<Room>(
  {
    name: {
      type: String,
      required: [true, "Room name is required"],
      trim: true,
      minlength: [3, "Room name must be at least 3 characters"],
      maxlength: [100, "Room name must be at most 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Room description must be at most 500 characters"],
    },
    roomCode: {
      type: String,
      required: [true, "Room code is required"],
      unique: true,
      uppercase: true,
      index: true,
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
    },
    owner: {
      type: String,
      required: true,
      index: true,
    },
    participants: {
      type: [participantSchema],
      default: [],
      validate: {
        validator: function (this: Room, participants: Participant[]) {
          return participants.length <= this.maxParticipants;
        },
        message: (props) => `Cannot add more than ${props.value} participants`,
      },
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    maxParticipants: {
      type: Number,
      default: 10,
      min: [2, "Room must allow at least 2 participants"],
      max: [100, "Room cannot exceed 100 participants"],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

roomSchema.index({ owner: 1, isActive: 1 });
roomSchema.index({ "participants.userId": 1 });
roomSchema.index({ createdAt: -1 });

roomSchema.statics.generateRoomCode = async function (): Promise<string> {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let roomCode: string;
  let exists = true;
  while (exists) {
    roomCode = "";
    for (let i = 0; i < 6; i++) {
      roomCode += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    exists = await this.findOne({ roomCode });
  }
  return roomCode!;
};

// Method to check if user is participant
roomSchema.methods.isParticipant = function (userId: string): boolean {
  return this.participants.some(
    (p: Participant) => p.userId.toString() === userId
  );
};

// Method to check if user is owner
roomSchema.methods.isOwner = function (userId: string): boolean {
  return this.owner.toString() === userId;
};

// Method to get participant role
roomSchema.methods.getParticipantRole = function (
  userId: string
): string | null {
  const participant = this.participants.find(
    (p: Participant) => p.userId.toString() === userId
  );
  return participant ? participant.role : null;
};

// Update lastActivity before save
roomSchema.pre("save", function (next) {
  this.lastActivity = new Date();
  next();
});

export default mongoose.models.Room || mongoose.model<Room>("Room", roomSchema);
