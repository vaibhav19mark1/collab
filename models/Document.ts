import mongoose, { Schema } from "mongoose";

const documentSchema = new Schema(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    title: {
      type: String,
      required: true,
      default: "Untitled Document",
    },
    type: {
      type: String,
      enum: ["richtext", "code", "whiteboard"],
      required: true,
      default: "richtext",
    },
    createdBy: {
      type: String,
      required: true,
    },
    lastEditedBy: {
      type: String,
    },
    lastEditedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ roomId: 1, type: 1 });

const Document =
  mongoose.models.Document || mongoose.model("Document", documentSchema);

export default Document;
