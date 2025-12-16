import mongoose, { Document, Schema } from "mongoose";

export interface User extends Document {
  id: string;
  name: string;
  username: string;
  password?: string;
  email: string;
  avatar?: string;
  googleId?: string;
  isVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (password: string) => Promise<boolean>;
}

const userSchema = new Schema<User>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
    },
    name: {
      type: String,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name must be at most 50 characters"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      minlength: [2, "Username must be at least 2 characters"],
      maxlength: [50, "Username must be at most 50 characters"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function (this: User) {
        // Password is required only if googleId is not present
        return !this.googleId;
      },
      minlength: [6, "Password must be at least 6 characters"],
    },
    googleId: {
      type: String,
      sparse: true, // Allows multiple documents without googleId
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model<User>("User", userSchema);
