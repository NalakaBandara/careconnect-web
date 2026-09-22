"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  cancelAppointment,
  fetchAppointmentByReference,
  moveAppointment,
} from "@/lib/appointments";
import { fetchAvailability, resolveFreeSlot } from "@/lib/booking";
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
  const days = await fetchAvailability(input.professionalId, input.clinicId);
  const found = resolveFreeSlot(days, input.date, input.time);

  if (!found?.slot.scheduleId || !found.slot.endTime) {
    return { message: "That time is no longer available. Please choose another." };
  }

  const ok = await moveAppointment(appointment.id, {
    appointmentDate: input.date,
    startTime: `${input.time}:00`,
    endTime: `${found.slot.endTime}:00`,
    doctorScheduleId: found.slot.scheduleId,
  });

  if (!ok) return { message: "The appointment could not be moved. Please try again." };

  revalidateAppointments(input.reference);

  // Outside any try/catch - redirect() signals by throwing.
  redirect(`/dashboard/appointments/${input.reference}?moved=1`);
}
