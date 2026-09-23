import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { decodeJwt, jwtVerify, type JWTPayload } from "jose";

import { isAdminRole } from "@/lib/roles";

// The ONLY file that touches the session cookie. Everything else asks this
// module. That keeps the swap to the Express API to one place.

const COOKIE_NAME = "careconnect_session";

export type SessionUser = {
  id: string;
  email: string;
  roles: string[];
};

// Called from a Server Action or Route Handler only - cookies cannot be
// written while a page is rendering.
export async function createSession(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true, // JavaScript cannot read it, so an XSS cannot steal it
    secure: process.env.NODE_ENV === "production", // http://localhost has no TLS
    sameSite: "lax", // not sent on cross-site POSTs, which blunts CSRF
    path: "/",
    // Matches the API token's own lifetime. If the cookie outlived the token,
    // somebody would look signed in while every request failed with a 401.
    maxAge: 60 * 60 * 24, // seconds, not milliseconds
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

function toUser(payload: JWTPayload): SessionUser {
  return {
    id: String(payload.sub ?? ""),
    email: String(payload.email ?? ""),
    roles: Array.isArray(payload.roles) ? (payload.roles as string[]) : [],
  };
}

// Returns the signed-in user, or null. Never throws: a tampered or expired
// cookie should log someone out cleanly, not crash the page.
//
// The token is minted and signed by the CareConnect API with ITS secret, so we
// cannot check the signature unless that secret is shared with us.
//
//   API_JWT_SECRET set   -> the signature is verified here, as before.
//   API_JWT_SECRET unset -> the token is only decoded, and the claims are
//                           treated as a hint rather than proof.
//
// Decoding alone is safe enough for what this is used for, because it decides
// what to SHOW, never what data to hand over. Every piece of real data comes
// from the API, which checks the signature itself and rejects anything forged.
// So the worst a faked cookie achieves is an admin menu with nothing behind it.
//
// Wrapped in React's cache(), so it runs once per request no matter how many
// times it is asked. The proxy, the layout, the page and any action all want to
// know who this is, and without this each one would verify the token again.
export const getSession = cache(async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const apiSecret = process.env.API_JWT_SECRET;

  if (apiSecret) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(apiSecret));
      return toUser(payload);
    } catch {
      return null; // expired, or signed by someone else
    }
  }

  try {
    const payload = decodeJwt(token);

    // Expiry still has to be honoured. It is in the token in plain sight, so
    // checking it needs no secret, and it stops a dead session lingering in
    // the UI while every API call behind it fails.
    if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
      return null;
    }

    return toUser(payload);
  } catch {
    return null; // not a readable token at all
  }
})

// Prefer this over hasRole(user, "ADMIN") at call sites: which roles count as
// admin is a policy decision, and it lives in one place.
export function isAdmin(user: SessionUser | null) {
  return isAdminRole(user?.roles ?? []);
}

// The raw token, for forwarding to the API as a Bearer header. The browser's
// cookie authenticates it to *Next*, not to a separate API server - so Next
// has to pass the credential along itself.
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}
