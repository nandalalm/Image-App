import { z } from "zod";

export const registerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters long")
    .regex(/^[A-Za-z\s]+$/, "First name must contain only letters"),
  lastName: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^[A-Za-z\s]+$/.test(val),
      "Last name must contain only letters"
    ),
  email: z
    .string()
    .trim()
    .email("Invalid email format"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long"),
});
