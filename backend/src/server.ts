import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db";
import { connectRedis } from "./config/redisClient";
import { errorMiddleware } from "./middleware/errorMiddleware";
import authRoutes from "./routes/authRoute";

dotenv.config();
const app = express();

app.use(cors({ 
  origin: process.env.CLIENT_URL || "http://localhost:5173", 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());

// Connect to databases
connectDB();
connectRedis();

app.use("/api/auth", authRoutes);
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
