"use server";

import { redirect } from "next/navigation";
import { registerSchema } from "@/lib/schemas";

// What the form gets back after a submit.
export type RegisterState = {
  message?: string;
  fields?: Record<string, string[]>;
  // Sent back so a failed submit doesn't wipe what the user typed.
  values?: { firstName: string; lastName: string; email: string };
};

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const values = {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
  };

  const parsed = registerSchema.safeParse({
    ...values,
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return {
      message: "Please check the highlighted fields",
      fields: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  let response: Response;
  try {
    response = await fetch(`${process.env.API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    // The API is unreachable - a different problem from the API saying no.
    return { message: "Could not reach the server. Please try again.", values };
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      message: body?.error?.message ?? "Registration failed. Please try again.",
      fields: body?.error?.fields,
      values,
    };
  }

  // redirect() works by throwing, so it must sit outside any try/catch.
  redirect("/login?registered=1");
}
