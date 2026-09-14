// STUB. Stands in for POST /api/auth/login on the Express API.
// Delete this file once the real API is ready. See docs/api-contract.md.

import { SignJWT } from "jose";
import { loginSchema } from "@/lib/schemas";
import { STUB_USERS, toPublicUser } from "@/lib/stub-users";

// The same message whichever half of the credentials is wrong. Saying
// "no such account" would let anyone discover which emails are registered.
const INVALID = { error: { message: "Invalid email or password" } };

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: { message: "Request body must be valid JSON" } },
      { status: 400 },
    );
  }

  const result = loginSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      {
        error: {
          message: "Please check the highlighted fields",
          fields: result.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  const { email, password } = result.data;
  const user = STUB_USERS.find((candidate) => candidate.email === email);

  // A real API compares against a stored hash. Plain comparison is only safe
  // because these are throwaway fixtures.
  if (!user || user.password !== password) {
    return Response.json(INVALID, { status: 401 });
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    // Fail loudly rather than signing tokens with an empty key.
    throw new Error("SESSION_SECRET is not set. Add it to .env.local");
  }

  const token = await new SignJWT({
    email: user.email,
    roles: user.roles,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(secret));

  return Response.json({ token, user: toPublicUser(user) }, { status: 200 });
}
