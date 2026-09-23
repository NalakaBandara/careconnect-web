"use server";

import { redirect } from "next/navigation";
import { loginSchema } from "@/lib/schemas";
import { safeNext } from "@/lib/redirects";
import { createSession } from "@/lib/session";

export type LoginState = {
  message?: string;
  fields?: Record<string, string[]>;
  values?: { email: string };
};

export async function loginAction(
  next: string,
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

  // Checked again here. bind() signs its arguments, but this action is a
  // public endpoint and validating a redirect target twice costs nothing.
  // Outside any try/catch - redirect() signals by throwing.
  //
  // The cast is needed because typedRoutes narrows redirect() to routes known
  // at build time, and this one is only known at run time. The type is taken
  // from redirect's own signature rather than written out, so it cannot drift
  // from it. safeNext is what makes the value safe; the cast only tells the
  // compiler that.
  redirect(safeNext(next) as Parameters<typeof redirect>[0]);
}

export async function logoutAction() {
  const { destroySession } = await import("@/lib/session");
  await destroySession();
  redirect("/");
}
