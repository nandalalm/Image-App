import { z } from "zod";

export const otpSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
});
