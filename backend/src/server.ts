import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db";
import { connectRedis } from "./config/redisClient";
import { errorMiddleware } from "./middleware/errorMiddleware";
import { loggerMiddleware } from "./middleware/loggerMiddleware";
import authRoutes from "./routes/authRoute";
import imageRoutes from "./routes/imageRoute";
import userRoutes from "./routes/userRoute";

dotenv.config();
const app = express();

app.use(cors({ 
  origin: process.env.CLIENT_URL, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());
app.use(loggerMiddleware);

connectDB();
connectRedis();

app.use("/api/auth", authRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/user", userRoutes);
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
