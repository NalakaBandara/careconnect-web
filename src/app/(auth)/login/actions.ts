"use server";

import { redirect } from "next/navigation";
import { loginSchema } from "@/lib/schemas";
import { createSession } from "@/lib/session";

export type LoginState = {
  message?: string;
  fields?: Record<string, string[]>;
  values?: { email: string };
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const values = { email: String(formData.get("email") ?? "") };

  const parsed = loginSchema.safeParse({
    email: values.email,
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
    response = await fetch(`${process.env.API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store", // never cache an authentication attempt
    });
  } catch {
    return { message: "Could not reach the server. Please try again.", values };
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    // The API returns one message for the whole form, not per field, and for a
    // failed login that is deliberate: saying which of the email or password
    // was wrong would tell a stranger which emails are registered.
    return {
      message: body?.error?.message ?? "Login failed. Please try again.",
      values,
    };
  }

  if (!body?.accessToken) {
    return { message: "The server did not return a session token.", values };
  }

  // Store the token in an httpOnly cookie. From here on the user is logged in.
  await createSession(body.accessToken);

  // Outside any try/catch - redirect() signals by throwing.
  redirect("/dashboard");
}

export async function logoutAction() {
  const { destroySession } = await import("@/lib/session");
  await destroySession();
  redirect("/");
}
