import "server-only";

import { redirect } from "next/navigation";

import { getSession, isAdmin, type SessionUser } from "@/lib/session";

// The permission checks every protected page and Server Action runs.
//
// These lived as a private copy inside each of the four admin action files.
// Four copies of a security check is four chances for one of them to drift,
// and the one that drifts is the one nobody notices.
//
// They RETURN the user rather than just checking, which removes the
// `(await getSession())!` that two pages needed. A non-null assertion on a
// security check is a promise the compiler cannot keep.

/** Any signed-in user. Guests go to login. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

/**
 * An admin.
 *
 * A signed-in non-admin gets /forbidden, not /login: they are already
 * authenticated, so being asked to sign in again is a dead end that implies it
 * would help.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isAdmin(user)) redirect("/forbidden");
  return user;
}
