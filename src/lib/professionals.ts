import "server-only";

import type { Professional, SlotDay } from "@/types";

// The only way a PAGE reads professionals. It goes through the API rather than
// importing the store, and that is not ceremony - it is the bug fix.
//
// Next builds Route Handlers and Server Components into separate module
// graphs, so a module-level array is NOT one shared array: the API had six
// professionals while the pages still had four. Admin edits appeared to save
// and then vanish.
//
// Reading through the API is also the only shape that survives Express. Once
// the data lives in another process there is no module to import, so any page
// that reached into the store would have to be rewritten anyway.

export async function fetchProfessionals(): Promise<Professional[]> {
  const response = await fetch(`${process.env.STUB_BASE_URL}/professionals`, {
    cache: "no-store", // an admin edit must show on the next request
  }).catch(() => null);

  if (!response?.ok) return [];

  const body = await response.json().catch(() => null);
  return body?.professionals ?? [];
}

export async function fetchProfessional(id: string): Promise<Professional | null> {
  const response = await fetch(
    `${process.env.STUB_BASE_URL}/professionals/${encodeURIComponent(id)}`,
    { cache: "no-store" },
  ).catch(() => null);

  if (!response?.ok) return null;

  const body = await response.json().catch(() => null);
  return body?.professional ?? null;
}

// Availability, with other people's bookings already taken into account. Same
// reason as above: the store lives in the API's module graph, so a page that
// generated slots locally would not know what anyone else had booked.
export async function fetchSlotDays(professionalId: string): Promise<SlotDay[]> {
  const response = await fetch(
    `${process.env.STUB_BASE_URL}/professionals/${encodeURIComponent(professionalId)}/slots`,
    { cache: "no-store" },
  ).catch(() => null);

  if (!response?.ok) return [];

  const body = await response.json().catch(() => null);
  return body?.days ?? [];
}
