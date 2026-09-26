"use server";

import { redirect } from "next/navigation";

import { anonymiseAccount } from "@/lib/account";
import { requireUser } from "@/lib/guards";
import { destroySession } from "@/lib/session";

export type CloseAccountState = { message?: string };

export async function closeAccountAction(
  _prev: CloseAccountState,
  formData: FormData,
): Promise<CloseAccountState> {
  // The id comes from the signed session, never from the form, so the browser
  // cannot aim this at another account.
  const user = await requireUser();

  // It cannot be undone, so the explicit confirmation is checked here too. The
  // dialog asks for it, but a Server Action can be called without the dialog.
  if (formData.get("confirm") !== "on") {
    return { message: "Tick the box to confirm you understand this cannot be undone." };
  }

  if (!/^\d+$/.test(user.id)) {
    return { message: "Your session looks out of date. Please log out and in again." };
  }

  const { error } = await anonymiseAccount(user.id);
  if (error) return { message: error };

  // Their email no longer exists, so the session is ended here rather than
  // leaving them signed in to an account that is gone.
  await destroySession();

  // Outside any try/catch - redirect() signals by throwing.
  redirect("/?closed=1");
}
