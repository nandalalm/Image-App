import mongoose from "mongoose";
import { logError, logInfo } from "../middleware/loggerMiddleware";

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("MongoDB Connected");
    logInfo("MongoDB Connected successfully");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    logError(err as Error, undefined, { context: "Database connection" });
    process.exit(1);
  }
};
