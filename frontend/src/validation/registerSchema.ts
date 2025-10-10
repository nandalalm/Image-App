import { z } from "zod";

export const registerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .refine((val) => val.length > 0, "This field cannot be empty")
    .refine((val) => val.length >= 4, "First name must be at least 4 characters long")
    .refine((val) => /^[A-Za-z]+$/.test(val), "First name must contain only letters (no spaces, numbers, or special characters)"),
  lastName: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || (val.length > 0 && /^[A-Za-z]+$/.test(val)),
      "Last name must contain only letters (no spaces, numbers, or special characters)"
    ),
  email: z
    .string()
    .trim()
    .refine((val) => val.length > 0, "This field cannot be empty")
    .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Invalid email format"),
  password: z
    .string()
    .refine((val) => val.length > 0, "This field cannot be empty")
    .refine((val) => val.length >= 6, "Password must be at least 6 characters long")
    .refine((val) => /[A-Z]/.test(val), "Password must contain at least 1 uppercase letter")
    .refine((val) => /[a-z]/.test(val), "Password must contain at least 1 lowercase letter")
    .refine((val) => /[0-9]/.test(val), "Password must contain at least 1 number")
    .refine((val) => /[^A-Za-z0-9]/.test(val), "Password must contain at least 1 special character"),
  confirmPassword: z
    .string()
    .refine((val) => val.length > 0, "This field cannot be empty"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
