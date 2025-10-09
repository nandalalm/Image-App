import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  }
};
