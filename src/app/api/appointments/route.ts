// STUB. Stands in for POST/GET /api/appointments on the Express API.
// Delete this file once the real API is ready. See docs/api-contract.md.

import { jwtVerify } from "jose";
import { bookingSchema } from "@/lib/schemas";
import { getProfessionalById } from "@/data/professionals";
import { resolveFreeSlot, SLOT_DURATION_MINUTES } from "@/lib/slots";
import { createAppointment, isSlotTaken, listAppointments } from "@/lib/stub-appointments";

const UNAUTHORISED = Response.json(
  { error: { message: "You need to be signed in to do that" } },
  { status: 401 },
);

// Reads the Bearer token the way Express will have to. The cookie is Next's
// business; an API server only ever sees the Authorization header.
async function callerId(request: Request): Promise<string | null> {
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

export async function POST(request: Request) {
  const userId = await callerId(request);
  if (!userId) return UNAUTHORISED;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { message: "Request body must be valid JSON" } }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const professionalId = String(payload.professionalId ?? "");
  const date = String(payload.date ?? "");
  const time = String(payload.time ?? "");

  // Same rules the form used. The form is bypassable; this is not.
  const result = bookingSchema.safeParse(payload);
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

  if (!getProfessionalById(professionalId)) {
    return Response.json({ error: { message: "Unknown professional" } }, { status: 404 });
  }

  // Re-check the slot server-side. The page checked it too, but minutes may
  // have passed since it rendered.
  if (!resolveFreeSlot(professionalId, date, time)) {
    return Response.json(
      { error: { message: "That appointment time is no longer available" } },
      { status: 409 },
    );
  }

  if (isSlotTaken(professionalId, date, time)) {
    return Response.json(
      { error: { message: "Someone has just booked that time. Please choose another." } },
      { status: 409 },
    );
  }

  const appointment = createAppointment({
    userId,
    professionalId,
    date,
    time,
    durationMinutes: SLOT_DURATION_MINUTES,
    reason: result.data.reason,
    notes: result.data.notes,
    contactNumber: result.data.contactNumber,
  });

  return Response.json({ appointment }, { status: 201 });
}

export async function GET(request: Request) {
  const userId = await callerId(request);
  if (!userId) return UNAUTHORISED;

  return Response.json({ appointments: listAppointments(userId) });
}
