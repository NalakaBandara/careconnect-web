import "server-only";

import { jwtVerify } from "jose";

// TEMPORARY, part of the stub API. Deleted with src/app/api/.
//
// Reads the Bearer token the way Express will have to. The session cookie is
// Next's business; a separate API server only ever sees the Authorization
// header, so this deliberately does not look at cookies.

export async function callerId(request: Request): Promise<string | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(
      header.slice("Bearer ".length),
      new TextEncoder().encode(secret),
    );
    return payload.sub ? String(payload.sub) : null;
  } catch {
    return null; // expired or tampered with
  }
}

export function unauthorised(): Response {
  return Response.json(
    { error: { message: "You need to be signed in to do that" } },
    { status: 401 },
  );
}
