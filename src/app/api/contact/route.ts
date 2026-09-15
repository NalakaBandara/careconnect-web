// STUB. Stands in for POST /api/contact on the Express API.
// Delete this file once the real API is ready. See docs/api-contract.md.

import { contactSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { message: "Request body must be valid JSON" } }, { status: 400 });
  }

  // Same rules the form used. The form is bypassable; this is not.
  const result = contactSchema.safeParse(body);
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

  // A real API would queue an email and store the enquiry. The stub only
  // confirms it arrived - deliberately without logging the message body,
  // which is somebody's personal correspondence.
  console.log(`[contact] enquiry from ${result.data.email}: ${result.data.subject}`);

  return Response.json({ received: true }, { status: 201 });
}
