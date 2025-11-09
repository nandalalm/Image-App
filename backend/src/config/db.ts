import mongoose from "mongoose";
import { logError, logInfo } from "../middleware/loggerMiddleware";

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI environment variable is not defined");
    }
    await mongoose.connect(mongoUri);
    console.log("MongoDB Connected");
    logInfo("MongoDB Connected successfully");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    logError(err as Error, undefined, { context: "Database connection" });
    process.exit(1);
  }
};
