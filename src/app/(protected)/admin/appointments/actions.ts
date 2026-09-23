"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/guards";
import { checkInAppointment, setAppointmentStatus } from "@/lib/admin";

export type StatusState = { message?: string };

// Changing an appointment's status is visible to the patient who booked it,
// so their pages are stale too, not only the admin list.
function revalidateEverywhere() {
  revalidatePath("/admin/appointments");
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard");
}

// Moving an appointment along Pending, Confirmed, Completed. In a larger
// system a clinic would do this; here the admin does, because the brief asks
// for three roles and admin is the one that owns the data.
export async function setStatusAction(
  input: { id: string; status: string },
  _prev: StatusState,
): Promise<StatusState> {
  await requireAdmin();

  const { error } = await setAppointmentStatus(input.id, input.status);
  if (error) return { message: error };

  revalidateEverywhere();
  return {};
}

// What the front desk would do when the patient physically arrives.
export async function checkInAction(id: string, _prev: StatusState): Promise<StatusState> {
  await requireAdmin();

  const { error } = await checkInAppointment(id);
  if (error) return { message: error };

  revalidateEverywhere();
  return {};
}
