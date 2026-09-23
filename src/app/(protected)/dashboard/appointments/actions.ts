"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  cancelAppointment,
  fetchAppointmentByReference,
  moveAppointment,
} from "@/lib/appointments";
import { checkSlot, fetchDayAvailability } from "@/lib/booking";
import { getSession } from "@/lib/session";

export type MutationState = { message?: string };

// A Server Action is a public endpoint. It can be invoked without the page
// ever being loaded, so the session is checked here as well as in the layout.
async function requireUser() {
  const user = await getSession();
  if (!user) redirect("/login");
}

// The lists are fetched with cache: "no-store", so the server is never stale.
// But Next also keeps a client-side Router Cache of pages already visited, and
// that would happily show the old list after a change.
function revalidateAppointments(reference?: string) {
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard");
  if (reference) revalidatePath(`/dashboard/appointments/${reference}`);
}

export async function cancelAppointmentAction(
  reference: string,
  _prev: MutationState,
): Promise<MutationState> {
  await requireUser();

  // Looked up in the caller's own appointments, so a reference belonging to
  // somebody else is simply not found.
  const appointment = await fetchAppointmentByReference(reference);
  if (!appointment) return { message: "That appointment could not be found." };

  const ok = await cancelAppointment(appointment.id);
  if (!ok) return { message: "The appointment could not be cancelled. Please try again." };

  revalidateAppointments(reference);
  return {};
}

export async function rescheduleAppointmentAction(
  input: { reference: string; professionalId: string; clinicId: string; date: string; time: string },
  _prev: MutationState,
): Promise<MutationState> {
  await requireUser();

  const appointment = await fetchAppointmentByReference(input.reference);
  if (!appointment) return { message: "That appointment could not be found." };

  // Re-check the slot. The page showed it as free, but that was some time ago.
  // One request, for the one day in question. Re-checking the whole
  // fortnight to verify a single time wasted the request budget that the
  // booking itself then needed.
  const day = await fetchDayAvailability(input.professionalId, input.clinicId, input.date);
  const check = checkSlot(day, input.time);

  if (check.status === "unknown") {
    // Could not reach the API to check. That is not the same as the slot being
    // taken, and telling them it is taken would move the appointment nowhere
    // while implying somebody else got in first.
    return { message: "We could not confirm that time just now. Please try again in a moment." };
  }

  if (check.status === "taken") {
    return { message: "That time is no longer available. Please choose another." };
  }

  const ok = await moveAppointment(appointment.id, {
    appointmentDate: input.date,
    startTime: `${input.time}:00`,
    endTime: `${check.endTime}:00`,
    doctorScheduleId: check.scheduleId,
  });

  if (!ok) return { message: "The appointment could not be moved. Please try again." };

  revalidateAppointments(input.reference);

  // Outside any try/catch - redirect() signals by throwing.
  redirect(`/dashboard/appointments/${input.reference}?moved=1`);
}
