import "server-only";

import { getSessionToken } from "@/lib/session";
import { longDate, todayIso } from "@/lib/date-format";
import type { Appointment } from "@/types";

// The only place pages get appointments from. When Express arrives, the fetch
// URL changes and nothing else does.

export type DecoratedAppointment = Appointment & {
  longDate: string;
  isPast: boolean;
};

// The stored date is "YYYY-MM-DD", which compares correctly as a plain string -
// no Date parsing, so no timezone surprises.
//
// The date used to be read off the generated slot grid, which only covered the
// next fortnight - so anything older fell back to a second, differently
// worded formatter. One shared formatter removes both the coupling and the
// inconsistency.
function decorate(appointment: Appointment): DecoratedAppointment {
  return {
    ...appointment,
    longDate: longDate(appointment.date),
    isPast: appointment.date < todayIso(),
  };
}

export async function fetchAppointments(): Promise<DecoratedAppointment[]> {
  const token = await getSessionToken();

  const response = await fetch(`${process.env.STUB_BASE_URL}/appointments`, {
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
    `${process.env.STUB_BASE_URL}/appointments/${encodeURIComponent(reference)}`,
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
