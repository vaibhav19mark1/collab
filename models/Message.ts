import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface Message extends Document {
  roomId: Types.ObjectId;
  userId: string;
  username: string;
  avatar?: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<Message>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
    message: {
      type: String,
      required: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
messageSchema.index({ roomId: 1, createdAt: -1 });

const Message: Model<Message> =
  mongoose.models.Message || mongoose.model<Message>("Message", messageSchema);

export default Message;
