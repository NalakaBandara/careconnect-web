import "server-only";

import type { Appointment } from "@/types";

// TEMPORARY. Stands in for the appointments table until the Express API is
// ready, so the booking flow has somewhere to write.
//
// This is an in-memory array, which means every booking is lost when the
// server restarts - and in dev, when a file changes. That is fine for a
// week-long fixture and would be indefensible in anything real. The whole
// file is deleted in one go; see docs/api-contract.md for the shape Express
// has to return.

const appointments: Appointment[] = [];

function reference(professionalId: string): string {
  // "CC-4821-MEH" - four digits and the first three letters of the surname,
  // matching the format in the designs.
  const digits = String(1000 + Math.floor(Math.random() * 9000));
  const surname = professionalId.split("-").at(-1) ?? "CCX";
  return `CC-${digits}-${surname.slice(0, 3).toUpperCase()}`;
}

export function isSlotTaken(professionalId: string, date: string, time: string): boolean {
  return appointments.some(
    (appointment) =>
      appointment.professionalId === professionalId &&
      appointment.date === date &&
      appointment.time === time &&
      appointment.status !== "cancelled",
  );
}

export function createAppointment(
  input: Omit<Appointment, "reference" | "status" | "createdAt">,
): Appointment {
  const appointment: Appointment = {
    ...input,
    reference: reference(input.professionalId),
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };

  appointments.push(appointment);
  return appointment;
}

// Scoped to one user on purpose. An endpoint that returned everyone's
// appointments because the caller forgot to filter is a real class of bug.
export function listAppointments(userId: string): Appointment[] {
  return appointments
    .filter((appointment) => appointment.userId === userId)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

export function findAppointment(userId: string, ref: string): Appointment | null {
  return (
    appointments.find(
      (appointment) => appointment.userId === userId && appointment.reference === ref,
    ) ?? null
  );
}
