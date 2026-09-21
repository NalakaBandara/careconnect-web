"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession, getSessionToken } from "@/lib/session";
import { resolveFreeSlot } from "@/lib/slots";
import { fetchSlotDays } from "@/lib/professionals";

export type MutationState = { message?: string };

async function patchAppointment(reference: string, body: Record<string, string>) {
  const token = await getSessionToken();

  return fetch(`${process.env.STUB_BASE_URL}/appointments/${encodeURIComponent(reference)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

export async function cancelAppointmentAction(
  reference: string,
  _prev: MutationState,
): Promise<MutationState> {
  // A Server Action is a public endpoint. It can be called without ever
  // loading the page, so the session is checked here too.
  const user = await getSession();
  if (!user) redirect("/login");

  let response: Response;
  try {
    response = await patchAppointment(reference, { status: "cancelled" });
  } catch {
    return { message: "Could not reach the server. Please try again." };
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    return {
      message: body?.error?.message ?? "The appointment could not be cancelled.",
    };
  }

  // The list is rendered from a no-store fetch, but the route itself can still
  // be held in the client-side Router Cache. This tells Next that anything
  // under /appointments is now stale.
  revalidatePath("/dashboard/appointments");
  return {};
}

export async function rescheduleAppointmentAction(
  input: { reference: string; professionalId: string; date: string; time: string },
  _prev: MutationState,
): Promise<MutationState> {
  const user = await getSession();
  if (!user) redirect("/login");

  // Re-check the slot. The page showed it as free, but that was some time ago.
  const days = await fetchSlotDays(input.professionalId);
  if (!resolveFreeSlot(days, input.date, input.time)) {
    return { message: "That time is no longer available. Please choose another." };
  }

  let response: Response;
  try {
    response = await patchAppointment(input.reference, {
      date: input.date,
      time: input.time,
    });
  } catch {
    return { message: "Could not reach the server. Please try again." };
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    return {
      message: body?.error?.message ?? "The appointment could not be moved.",
    };
  }

  revalidatePath("/dashboard/appointments");

  // Outside any try/catch - redirect() signals by throwing.
  redirect(`/dashboard/appointments/${input.reference}?moved=1`);
}
