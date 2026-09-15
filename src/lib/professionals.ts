import "server-only";

import type { Professional } from "@/types";

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
  const response = await fetch(`${process.env.API_BASE_URL}/professionals`, {
    cache: "no-store", // an admin edit must show on the next request
  }).catch(() => null);

  if (!response?.ok) return [];

  const body = await response.json().catch(() => null);
  return body?.professionals ?? [];
}

export async function fetchProfessional(id: string): Promise<Professional | null> {
  const response = await fetch(
    `${process.env.API_BASE_URL}/professionals/${encodeURIComponent(id)}`,
    { cache: "no-store" },
  ).catch(() => null);

  if (!response?.ok) return null;

  const body = await response.json().catch(() => null);
  return body?.professional ?? null;
}
