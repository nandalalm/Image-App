import { z } from "zod";

export const imageTitleSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(50, "Title must be 50 characters or less")
    .refine((val) => val.trim().length > 0, {
      message: "Title cannot be empty or contain only spaces",
    })
    .refine((val) => /^[A-Za-z0-9\s]+$/.test(val.trim()), {
      message: "Title must contain only letters, numbers, and spaces",
    })
    .refine((val) => val === val.trim(), {
      message: "Title cannot have leading or trailing spaces",
    }),
});

export type ImageTitleData = z.infer<typeof imageTitleSchema>;
