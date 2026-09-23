"use server";

import { redirect } from "next/navigation";
import { createAppointment } from "@/lib/appointments";
import { checkSlot, fetchDayAvailability } from "@/lib/booking";
import { getSession } from "@/lib/session";

export type BookingState = {
  message?: string;
  fields?: Record<string, string[]>;
  values?: { reason: string };
};

type Slot = {
  professionalId: string;
  clinicId: string;
  serviceId: string;
  date: string;
  time: string;
};

// The slot arrives as a BOUND argument, not a hidden input. Next signs bound
// arguments, so the browser cannot rewrite them; a hidden <input> it could.
export async function bookingAction(
  slot: Slot,
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const values = { reason: String(formData.get("reason") ?? "") };

  // A Server Action is its own public endpoint, reachable without the page
  // ever being loaded, so the session is checked here too.
  const user = await getSession();
  if (!user) redirect("/login");

  // The API only stores a reason, so that plus consent is all this collects.
  // The name and contact number the old form asked for are already on the
  // account, and asking again would be collecting them twice.
  if (values.reason.trim().length === 0) {
    return {
      message: "Please check the highlighted fields",
      fields: { reason: ["Tell the clinic the reason for your visit"] },
      values,
    };
  }

  if (formData.get("consent") !== "on") {
    return {
      message: "Please check the highlighted fields",
      fields: { consent: ["You need to agree before the clinic can be contacted"] },
      values,
    };
  }

  // Re-check the slot against the API. The page rendered it as free, but a
  // form can sit open a long while before anybody presses the button.
  // One request, for the one day in question. Re-checking the whole
  // fortnight to verify a single time wasted the request budget that the
  // booking itself then needed.
  const day = await fetchDayAvailability(slot.professionalId, slot.clinicId, slot.date);
  const check = checkSlot(day, slot.time);

  if (check.status === "unknown") {
    // The re-check did not get an answer. Saying the slot is gone would send
    // this person off to choose another time for no reason, and the next one
    // would fail identically.
    return {
      message: "We could not confirm that time just now. Please try again in a moment.",
      values,
    };
  }

  if (check.status === "taken") {
    return {
      message: "That appointment time is no longer available. Please choose another.",
      values,
    };
  }

  const { appointment, error } = await createAppointment({
    doctorProfileId: slot.professionalId,
    clinicId: slot.clinicId,
    serviceId: slot.serviceId,
    doctorScheduleId: check.scheduleId,
    appointmentDate: slot.date,
    startTime: `${slot.time}:00`,
    endTime: `${check.endTime}:00`,
    reason: values.reason.trim(),
  });

  if (error || !appointment?.bookingReference) {
    return { message: error ?? "The booking could not be saved.", values };
  }

  // Outside any try/catch - redirect() signals by throwing.
  redirect(`/book/${slot.professionalId}/confirmed?ref=${appointment.bookingReference}`);
}
