import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  profileImageUrl?: string;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImageUrl: { type: String },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>("User", userSchema);
