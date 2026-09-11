import { z } from "zod";

// One set of rules, used by the forms in the browser AND by the server.
// Keeping them in a single file means the two can never drift apart.

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name"),
  lastName: z.string().trim().min(1, "Enter your last name"),
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  // No length rules here. Telling someone their password is "too short" at
  // login would leak information about the stored password.
  password: z.string().min(1, "Enter your password"),
});

// Types generated from the rules above, so the shape can never disagree.
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
