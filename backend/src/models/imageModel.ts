import mongoose, { Document, Schema } from "mongoose";

export interface IImage extends Document {
  title: string;
  imageUrl: string;
  s3Key: string;
  userId: mongoose.Types.ObjectId;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema<IImage>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    s3Key: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

imageSchema.index({ userId: 1, order: 1 });

export const ImageModel = mongoose.model<IImage>("Image", imageSchema);
