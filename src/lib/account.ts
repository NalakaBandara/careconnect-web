import "server-only";

import { getSessionToken } from "@/lib/session";

/**
 * Closes the signed-in user's account by anonymising it.
 *
 * The API replaces the name, email and phone with placeholders and keeps the
 * appointments, so the clinic's records still add up but nobody can tell who
 * the person was. That is the GDPR route for health data, rather than deleting
 * rows a clinic may be required to keep.
 *
 * The path takes the user's numeric id. `/users/me` is rejected by the API as
 * "id must be a valid numeric identifier", checked against the live service.
 * It refuses with 403 when the id is not the caller's own, so a user cannot
 * anonymise somebody else.
 */
export async function anonymiseAccount(userId: string): Promise<{ error: string | null }> {
  const token = await getSessionToken();

  const response = await fetch(
    `${process.env.API_BASE_URL}/users/${encodeURIComponent(userId)}?anonymisation=true`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  ).catch(() => null);

  if (!response) return { error: "Could not reach the server. Please try again." };
  if (response.ok) return { error: null };

  const body = await response.json().catch(() => null);
  return {
    error: body?.error?.message ?? "Your account could not be closed. Please try again.",
  };
}
