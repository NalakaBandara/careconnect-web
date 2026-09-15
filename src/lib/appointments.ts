import "server-only";

import { getSessionToken } from "@/lib/session";
import { findDay, getSlotDays } from "@/lib/slots";
import type { Appointment } from "@/types";

// The only place pages get appointments from. When Express arrives, the fetch
// URL changes and nothing else does.

export type DecoratedAppointment = Appointment & {
  longDate: string;
  isPast: boolean;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// The stored date is "YYYY-MM-DD", which compares correctly as a plain string -
// no Date parsing, so no timezone surprises.
function decorate(appointment: Appointment): DecoratedAppointment {
  const day = findDay(getSlotDays(appointment.professionalId, 14), appointment.date);

  return {
    ...appointment,
    longDate: day?.longDate ?? formatIsoDate(appointment.date),
    isPast: appointment.date < todayIso(),
  };
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Used for dates outside the generated slot window, which is most past ones.
function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export async function fetchAppointments(): Promise<DecoratedAppointment[]> {
  const token = await getSessionToken();

  const response = await fetch(`${process.env.API_BASE_URL}/appointments`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store", // somebody's own bookings must never be served from a cache
  }).catch(() => null);

  if (!response?.ok) return [];

  const body = await response.json().catch(() => null);
  const appointments: Appointment[] = body?.appointments ?? [];

  return appointments.map(decorate);
}

export async function fetchAppointment(
  reference: string,
): Promise<DecoratedAppointment | null> {
  const token = await getSessionToken();

  const response = await fetch(
    `${process.env.API_BASE_URL}/appointments/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  ).catch(() => null);

  if (!response?.ok) return null;

  const body = await response.json().catch(() => null);
  return body?.appointment ? decorate(body.appointment) : null;
}

// An appointment counts as upcoming while its date is today or later AND it
// has not been cancelled - a cancelled booking next week belongs in the past
// list, because there is nothing left to attend.
export function splitAppointments(appointments: DecoratedAppointment[]) {
  const upcoming = appointments.filter(
    (appointment) => !appointment.isPast && appointment.status !== "cancelled",
  );
  const past = appointments.filter(
    (appointment) => appointment.isPast || appointment.status === "cancelled",
  );

  return { upcoming, past };
}

export function canCancel(appointment: DecoratedAppointment): boolean {
  return !appointment.isPast && appointment.status !== "cancelled";
}
