// STUB. Stands in for POST /api/auth/register on the Express API.
// Delete this file once the real API is ready. See docs/api-contract.md.

import { registerSchema } from "@/lib/schemas";
import { STUB_USERS } from "@/lib/stub-users";

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

  // Validate with the same rules the form uses. Never trust the caller.
  const result = registerSchema.safeParse(body);
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

  const { firstName, lastName, email } = result.data;

  const alreadyExists = STUB_USERS.some((user) => user.email === email);
  if (alreadyExists) {
    return Response.json(
      {
        error: {
          message: "Email already registered",
          fields: { email: ["Email already registered"] },
        },
      },
      { status: 409 },
    );
  }

  // A real API would insert a row and hash the password. The stub just echoes back.
  return Response.json(
    {
      user: {
        id: Date.now(),
        firstName,
        lastName,
        email,
        roles: ["user"],
      },
    },
    { status: 201 },
  );
}
