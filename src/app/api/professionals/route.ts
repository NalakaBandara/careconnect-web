// STUB. Stands in for GET/POST /api/professionals on the Express API.
// Delete this file once the real API is ready. See docs/api-contract.md.

import { professionalSchema } from "@/lib/schemas";
import { createProfessional, listProfessionals } from "@/lib/professional-store";
import { caller, forbidden, unauthorised } from "@/lib/stub-api-auth";

// The directory is public - this is the same data the public pages show.
export async function GET() {
  return Response.json({ professionals: listProfessionals() });
}

export async function POST(request: Request) {
  const user = await caller(request);
  if (!user) return unauthorised();
  if (!user.roles.includes("admin")) return forbidden();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { message: "Request body must be valid JSON" } }, { status: 400 });
  }

  const result = professionalSchema.safeParse(body);
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

  const professional = createProfessional(result.data);
  return Response.json({ professional }, { status: 201 });
}
