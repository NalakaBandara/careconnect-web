import "server-only";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";

// The ONLY file that touches the session cookie. Everything else asks this
// module. That keeps the swap to the Express API to one place.

const COOKIE_NAME = "careconnect_session";

export type SessionUser = {
  id: string;
  email: string;
  roles: string[];
};

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set. Add it to .env.local");
  return new TextEncoder().encode(secret);
}

// Called from a Server Action or Route Handler only - cookies cannot be
// written while a page is rendering.
export async function createSession(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true, // JavaScript cannot read it, so an XSS cannot steal it
    secure: process.env.NODE_ENV === "production", // http://localhost has no TLS
    sameSite: "lax", // not sent on cross-site POSTs, which blunts CSRF
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // seconds, not milliseconds - matches the 7d token
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Returns the signed-in user, or null. Never throws: a tampered or expired
// cookie should log someone out cleanly, not crash the page.
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    return {
      id: String(payload.sub ?? ""),
      email: String(payload.email ?? ""),
      roles: Array.isArray(payload.roles) ? (payload.roles as string[]) : [],
    };
  } catch {
    return null;
  }
}

export function hasRole(user: SessionUser | null, role: string) {
  return user?.roles.includes(role) ?? false;
}

// The raw token, for forwarding to the API as a Bearer header. The browser's
// cookie authenticates it to *Next*, not to a separate API server - so Next
// has to pass the credential along itself.
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}
