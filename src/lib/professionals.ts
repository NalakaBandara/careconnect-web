import "server-only";

import type { SlotDay } from "@/types";

// The directory now comes from the real API. This file stays as the import
// everyone already uses, so the move did not touch a dozen call sites.
export { fetchProfessional, fetchProfessionals } from "@/lib/directory";

// TEMPORARY. Availability is still served by our own stub, because the API's
// slots come from doctor schedules and none exist yet. Moves to API_BASE_URL
// with the rest of booking.
export async function fetchSlotDays(professionalId: string): Promise<SlotDay[]> {
  const response = await fetch(
    `${process.env.STUB_BASE_URL}/professionals/${encodeURIComponent(professionalId)}/slots`,
    { cache: "no-store" },
  ).catch(() => null);

  if (!response?.ok) return [];

  const body = await response.json().catch(() => null);
  return body?.days ?? [];
}
