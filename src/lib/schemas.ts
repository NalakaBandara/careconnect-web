import { z } from "zod";

// One set of rules, used by the forms in the browser AND by the server.
// Keeping them in a single file means the two can never drift apart.

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name"),
  lastName: z.string().trim().min(1, "Enter your last name"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    // Order matters. .email().trim() validates BEFORE trimming, so a pasted
    // address with a trailing space was rejected as "not a valid email" with
    // nothing visibly wrong with it. Clean the value first, then check it.
    .pipe(z.email("Enter a valid email address")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    // Order matters. .email().trim() validates BEFORE trimming, so a pasted
    // address with a trailing space was rejected as "not a valid email" with
    // nothing visibly wrong with it. Clean the value first, then check it.
    .pipe(z.email("Enter a valid email address")),
  // No length rules here. Telling someone their password is "too short" at
  // login would leak information about the stored password.
  password: z.string().min(1, "Enter your password"),
});

// Types generated from the rules above, so the shape can never disagree.
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const bookingSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your full name"),
  contactNumber: z
    .string()
    .trim()
    .min(7, "Enter a contact number so the clinic can confirm")
    .regex(/^[0-9+()\s-]+$/, "Use digits, spaces and + ( ) - only"),
  reason: z.string().trim().min(1, "Tell the clinic the reason for your visit"),
  notes: z.string().trim().max(500, "Please keep this under 500 characters"),
  // A ticked checkbox submits the string "on"; an unticked one submits
  // nothing at all. So the only acceptable value is that exact string.
  //
  // This must NOT be .optional().refine(...) - inside z.object() an absent
  // key skips an optional field's refinement entirely, so a caller that
  // simply omitted "consent" would pass validation. A required literal has
  // no such hole: absent, undefined and wrong all fail.
  consent: z.literal("on", {
    message: "You need to agree before the clinic can be contacted",
  }),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your name"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    // Order matters. .email().trim() validates BEFORE trimming, so a pasted
    // address with a trailing space was rejected as "not a valid email" with
    // nothing visibly wrong with it. Clean the value first, then check it.
    .pipe(z.email("Enter a valid email address")),
  subject: z.string().trim().min(1, "Enter a subject"),
  message: z
    .string()
    .trim()
    .min(10, "Please write at least a sentence so we can help")
    .max(2000, "Please keep this under 2000 characters"),
});

export type ContactInput = z.infer<typeof contactSchema>;
