// STUB. Stands in for GET /api/professionals/:id/slots on the Express API.
// Delete this file once the real API is ready. See docs/api-contract.md.

import { availableSlotDays } from "@/lib/slot-availability";

// Public, like the rest of the directory: general availability is published
// on the profile page anyway. It returns the CLINIC's blocked times and the
// times other patients have booked as one "taken" flag - a caller has no
// business knowing which is which, and that would leak who booked what.
export async function GET(
  _request: Request,
  context: RouteContext<"/api/professionals/[professionalId]/slots">,
) {
  const { professionalId } = await context.params;

  return Response.json(
    { days: availableSlotDays(professionalId) },
    // Availability changes the moment anyone books, so it must never be
    // cached by a browser or a proxy.
    { headers: { "Cache-Control": "no-store" } },
  );
}
