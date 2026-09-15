import "server-only";

import { applyBookings, getSlotDays } from "@/lib/slots";
import { isSlotTaken } from "@/lib/stub-appointments";
import type { SlotDay } from "@/types";

// The generated grid with real bookings layered on. This is the only honest
// answer to "what is actually free", and it is API-side only: it touches the
// appointments store, which lives in the Route Handler module graph.
//
// Pages must not import this - they would get a different copy of the store
// and show stale availability. They call fetchSlotDays() instead.
export function availableSlotDays(professionalId: string, dayCount = 7): SlotDay[] {
  return applyBookings(getSlotDays(professionalId, dayCount), (date, time) =>
    isSlotTaken(professionalId, date, time),
  );
}
