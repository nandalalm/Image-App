import { createClient } from "redis";

let redisClient: ReturnType<typeof createClient> | null = null;
let isRedisConnected = false;

export const connectRedis = async (): Promise<void> => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
    });

    redisClient.on("connect", () => {
      console.log("✅ Redis Connected");
      isRedisConnected = true;
    });

    redisClient.on("error", () => {
      // Silently handle Redis errors to avoid spam
      isRedisConnected = false;
    });

    await redisClient.connect();
  } catch (err) {
    console.warn("⚠️  Redis not available, using in-memory storage for OTP");
    isRedisConnected = false;
    redisClient = null;
  }
};

// In-memory storage as fallback when Redis is not available
const otpStorage = new Map<string, { otp: string; expires: number }>();

export const setOTP = async (key: string, otp: string, ttl: number): Promise<void> => {
  if (isRedisConnected && redisClient) {
    await redisClient.setEx(key, ttl, otp);
  } else {
    // Use in-memory storage as fallback
    otpStorage.set(key, { otp, expires: Date.now() + ttl * 1000 });
  }
};

export const getOTP = async (key: string): Promise<string | null> => {
  if (isRedisConnected && redisClient) {
    return await redisClient.get(key);
  } else {
    // Use in-memory storage as fallback
    const stored = otpStorage.get(key);
    if (!stored || stored.expires < Date.now()) {
      otpStorage.delete(key);
      return null;
    }
    return stored.otp;
  }
};

export const deleteOTP = async (key: string): Promise<void> => {
  if (isRedisConnected && redisClient) {
    await redisClient.del(key);
  } else {
    otpStorage.delete(key);
  }
};
