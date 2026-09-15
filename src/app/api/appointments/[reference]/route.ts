// STUB. Stands in for GET/PATCH /api/appointments/:reference on the Express
// API. Delete this file once the real API is ready. See docs/api-contract.md.

import { callerId, unauthorised } from "@/lib/stub-api-auth";
import {
  findAppointment,
  isSlotTaken,
  moveAppointment,
  setAppointmentStatus,
} from "@/lib/stub-appointments";
import { resolveFreeSlot } from "@/lib/slots";
import { availableSlotDays } from "@/lib/slot-availability";

// Every lookup is scoped to the caller. A reference is short enough to guess,
// so "not yours" has to be indistinguishable from "does not exist" - otherwise
// someone could confirm which references are real.
const NOT_FOUND = { error: { message: "Appointment not found" } };

export async function GET(request: Request, context: RouteContext<"/api/appointments/[reference]">) {
  const userId = await callerId(request);
  if (!userId) return unauthorised();

  const { reference } = await context.params;
  const appointment = findAppointment(userId, reference);
  if (!appointment) return Response.json(NOT_FOUND, { status: 404 });

  return Response.json({ appointment });
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/appointments/[reference]">,
) {
  const userId = await callerId(request);
  if (!userId) return unauthorised();

  const { reference } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { message: "Request body must be valid JSON" } }, { status: 400 });
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const status = payload.status;
  const date = typeof payload.date === "string" ? payload.date : undefined;
  const time = typeof payload.time === "string" ? payload.time : undefined;

  const isCancel = status === "cancelled";
  const isMove = Boolean(date && time);

  // Exactly two changes are allowed: cancel it, or move it. An open-ended
  // PATCH would let a client mark its own appointment "completed", or edit
  // fields the clinic owns.
  if (!isCancel && !isMove) {
    return Response.json(
      {
        error: {
          message: 'Send either { "status": "cancelled" } or { "date", "time" }',
        },
      },
      { status: 400 },
    );
  }

  const existing = findAppointment(userId, reference);
  if (!existing) return Response.json(NOT_FOUND, { status: 404 });

  if (isMove) {
    if (existing.status === "cancelled" || existing.status === "completed") {
      return Response.json(
        { error: { message: "Only an active appointment can be moved" } },
        { status: 409 },
      );
    }

    // The slot has to be real and free. The page checked, but that was then.
    if (!resolveFreeSlot(availableSlotDays(existing.professionalId), date!, time!)) {
      return Response.json(
        { error: { message: "That appointment time is no longer available" } },
        { status: 409 },
      );
    }

    // Its own current slot is reported as taken by the store, so that one has
    // to be allowed through - otherwise moving to the same time would 409.
    const sameSlot = existing.date === date && existing.time === time;
    if (!sameSlot && isSlotTaken(existing.professionalId, date!, time!)) {
      return Response.json(
        { error: { message: "Someone has just booked that time. Please choose another." } },
        { status: 409 },
      );
    }

    const appointment = moveAppointment(userId, reference, date!, time!);
    return Response.json({ appointment });
  }

  if (existing.status === "cancelled") {
    return Response.json(
      { error: { message: "That appointment is already cancelled" } },
      { status: 409 },
    );
  }

  if (existing.status === "completed") {
    return Response.json(
      { error: { message: "A completed appointment cannot be cancelled" } },
      { status: 409 },
    );
  }

  const appointment = setAppointmentStatus(userId, reference, "cancelled");
  return Response.json({ appointment });
}
