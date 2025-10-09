import { z } from "zod";

export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  const parsed = schema.safeParse(data);
  if (parsed.success) return { valid: true, data: parsed.data, errors: {} };

  const errors: Record<string, string> = {};
  parsed.error.issues.forEach((issue) => {
    const field = issue.path[0] as string;
    errors[field] = issue.message;
  });

  return { valid: false, errors };
};
