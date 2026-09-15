import "server-only";

import type { Appointment, AppointmentStatus } from "@/types";

// TEMPORARY. Stands in for the appointments table until the Express API is
// ready, so the booking flow has somewhere to write.
//
// This is an in-memory array, which means every booking is lost when the
// server restarts - and in dev, when a file changes. That is fine for a
// week-long fixture and would be indefensible in anything real. The whole
// file is deleted in one go; see docs/api-contract.md for the shape Express
// has to return.

// The demo user, matching src/lib/stub-users.ts.
const DEMO_USER_ID = "1";

// Dates are relative to today, so "upcoming" and "past" stay meaningful
// however long this fixture lives. Fixed dates would silently all become past.
function dayOffset(days: number): string {
  const now = new Date();
  const shifted = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days),
  );
  return shifted.toISOString().slice(0, 10);
}

const appointments: Appointment[] = [
  {
    reference: "CC-4821-MEH",
    userId: DEMO_USER_ID,
    professionalId: "arun-mehta",
    date: dayOffset(3),
    time: "09:30",
    durationMinutes: 20,
    reason: "Health check-up",
    notes: "",
    contactNumber: "07700 900123",
    status: "confirmed",
    createdAt: new Date().toISOString(),
  },
  {
    reference: "CC-4903-TAN",
    userId: DEMO_USER_ID,
    professionalId: "kenji-tanaka",
    date: dayOffset(8),
    time: "07:30",
    durationMinutes: 40,
    reason: "Injury assessment",
    notes: "Left knee, ongoing since a half marathon in June.",
    contactNumber: "07700 900123",
    status: "awaiting",
    createdAt: new Date().toISOString(),
  },
  {
    reference: "CC-4410-OWU",
    userId: DEMO_USER_ID,
    professionalId: "grace-owusu",
    date: dayOffset(-95),
    time: "11:00",
    durationMinutes: 30,
    reason: "Dental examination",
    notes: "",
    contactNumber: "07700 900123",
    status: "completed",
    createdAt: new Date().toISOString(),
  },
  {
    reference: "CC-4288-MAR",
    userId: DEMO_USER_ID,
    professionalId: "elena-marsh",
    date: dayOffset(-140),
    time: "14:00",
    durationMinutes: 50,
    reason: "Initial assessment",
    notes: "",
    contactNumber: "07700 900123",
    status: "cancelled",
    createdAt: new Date().toISOString(),
  },
];

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

// Returns the updated appointment, or null if this user has no such
// appointment. Taking userId means a caller cannot change somebody else's row
// even by guessing a reference.
export function setAppointmentStatus(
  userId: string,
  ref: string,
  status: AppointmentStatus,
): Appointment | null {
  const appointment = findAppointment(userId, ref);
  if (!appointment) return null;

  appointment.status = status;
  return appointment;
}

// Moving keeps the same reference on purpose: the clinic and the patient have
// already written it down, and a new one would invalidate both copies.
export function moveAppointment(
  userId: string,
  ref: string,
  date: string,
  time: string,
): Appointment | null {
  const appointment = findAppointment(userId, ref);
  if (!appointment) return null;

  appointment.date = date;
  appointment.time = time;
  return appointment;
}
