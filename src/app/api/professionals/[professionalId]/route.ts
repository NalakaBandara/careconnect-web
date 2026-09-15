// STUB. Stands in for GET/PATCH/DELETE /api/professionals/:id on the Express
// API. Delete this file once the real API is ready. See docs/api-contract.md.

import { professionalSchema } from "@/lib/schemas";
import {
  deleteProfessional,
  findProfessional,
  updateProfessional,
} from "@/lib/professional-store";
import { caller, forbidden, unauthorised } from "@/lib/stub-api-auth";

const NOT_FOUND = { error: { message: "Professional not found" } };

export async function GET(
  _request: Request,
  context: RouteContext<"/api/professionals/[professionalId]">,
) {
  const { professionalId } = await context.params;
  const professional = findProfessional(professionalId);
  if (!professional) return Response.json(NOT_FOUND, { status: 404 });

  return Response.json({ professional });
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/professionals/[professionalId]">,
) {
  const user = await caller(request);
  if (!user) return unauthorised();
  if (!user.roles.includes("admin")) return forbidden();

  const { professionalId } = await context.params;

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

  const professional = updateProfessional(professionalId, result.data);
  if (!professional) return Response.json(NOT_FOUND, { status: 404 });

  return Response.json({ professional });
}

export async function DELETE(
  request: Request,
  context: RouteContext<"/api/professionals/[professionalId]">,
) {
  const user = await caller(request);
  if (!user) return unauthorised();
  if (!user.roles.includes("admin")) return forbidden();

  const { professionalId } = await context.params;
  if (!deleteProfessional(professionalId)) {
    return Response.json(NOT_FOUND, { status: 404 });
  }

  // 204 has no body by definition, so nothing is returned here.
  return new Response(null, { status: 204 });
}
