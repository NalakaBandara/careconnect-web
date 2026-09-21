"use server";

import { redirect } from "next/navigation";
import { bookingSchema } from "@/lib/schemas";
import { getSession, getSessionToken } from "@/lib/session";
import { resolveFreeSlot } from "@/lib/slots";
import { fetchSlotDays } from "@/lib/professionals";

export type BookingState = {
  message?: string;
  fields?: Record<string, string[]>;
  values?: {
    fullName: string;
    contactNumber: string;
    reason: string;
    notes: string;
  };
};

type Slot = {
  professionalId: string;
  date: string;
  time: string;
};

// The slot arrives as a BOUND argument, not a hidden input. Next signs bound
// arguments, so the browser cannot rewrite them - a hidden <input> it could.
export async function bookingAction(
  slot: Slot,
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const values = {
    fullName: String(formData.get("fullName") ?? ""),
    contactNumber: String(formData.get("contactNumber") ?? ""),
    reason: String(formData.get("reason") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };

  // A Server Action is a public endpoint - it can be called without ever
  // loading the page, so the layout's check is not enough on its own.
  const user = await getSession();
  if (!user) redirect("/login");

  const parsed = bookingSchema.safeParse({
    ...values,
    consent: formData.get("consent") ?? undefined,
  });

  if (!parsed.success) {
    return {
      message: "Please check the highlighted fields",
      fields: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  // Re-check the slot. The page rendered it as free, but that was some time ago.
  const days = await fetchSlotDays(slot.professionalId);
  if (!resolveFreeSlot(days, slot.date, slot.time)) {
    return {
      message: "That appointment time is no longer available. Please choose another.",
      values,
    };
  }

  const token = await getSessionToken();

  let response: Response;
  try {
    response = await fetch(`${process.env.STUB_BASE_URL}/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // The cookie proves who you are to Next. The API is a different
        // server, so Next forwards the token explicitly.
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...parsed.data, ...slot }),
      cache: "no-store",
    });
  } catch {
    return { message: "Could not reach the server. Please try again.", values };
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      message: body?.error?.message ?? "The booking could not be saved. Please try again.",
      fields: body?.error?.fields,
      values,
    };
  }

  const reference = body?.appointment?.reference;
  if (!reference) {
    return { message: "The server did not return a booking reference.", values };
  }

  // Outside any try/catch - redirect() signals by throwing.
  redirect(`/book/${slot.professionalId}/confirmed?ref=${reference}`);
}
