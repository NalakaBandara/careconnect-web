import "server-only";

import { longDate, todayIso } from "@/lib/date-format";
import { getSessionToken } from "@/lib/session";
import type { Appointment, AppointmentStatus } from "@/types";

// The only place pages read or change appointments.

export type DecoratedAppointment = Appointment & {
  /** "Monday 28 September 2026" */
  longDate: string;
  /** "09:00", since the API sends "09:00:00" and the seconds are never shown */
  time: string;
  durationMinutes: number;
  isPast: boolean;
  doctorName: string;
};

async function call<T>(path: string, init?: RequestInit): Promise<T | null> {
  const token = await getSessionToken();

  const response = await fetch(`${process.env.API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
    // Somebody's own bookings must never come from a cache.
    cache: "no-store",
  }).catch(() => null);

  if (!response?.ok) return null;
  // 204 has no body by definition, so there is nothing to parse.
  if (response.status === 204) return {} as T;

  return (await response.json().catch(() => null)) as T | null;
}

// The date is "YYYY-MM-DD", which compares correctly as plain text, so no Date
// parsing and therefore no timezone surprises.
function decorate(appointment: Appointment): DecoratedAppointment {
  return {
    ...appointment,
    longDate: longDate(appointment.appointmentDate),
    time: appointment.startTime.slice(0, 5),
    durationMinutes: appointment.service?.durationMinutes ?? 30,
    isPast: appointment.appointmentDate < todayIso(),
    doctorName:
      `${appointment.doctor?.firstName ?? ""} ${appointment.doctor?.lastName ?? ""}`.trim(),
  };
}

export async function fetchAppointments(): Promise<DecoratedAppointment[]> {
  const body = await call<{ data: Appointment[] }>("/appointments/me");

  return (body?.data ?? [])
    .map(decorate)
    .sort((a, b) =>
      `${a.appointmentDate}${a.startTime}`.localeCompare(`${b.appointmentDate}${b.startTime}`),
    );
}

// The API addresses appointments by numeric id, but the booking reference is
// what the patient is given and would quote to the clinic, so that is what the
// URLs use. Looking it up inside the caller's own list also means somebody
// else's reference is simply not found, with no extra permission check needed.
export async function fetchAppointmentByReference(
  reference: string,
): Promise<DecoratedAppointment | null> {
  const appointments = await fetchAppointments();
  return appointments.find((a) => a.bookingReference === reference) ?? null;
}

const ACTIVE: AppointmentStatus[] = ["PENDING", "CONFIRMED"];

// Upcoming means the date has not passed AND it is still active. A booking
// cancelled for next week is not something to turn up to.
export function splitAppointments(appointments: DecoratedAppointment[]) {
  const upcoming = appointments.filter((a) => !a.isPast && ACTIVE.includes(a.status));
  const past = appointments.filter((a) => a.isPast || !ACTIVE.includes(a.status));

  return { upcoming, past };
}

export function canCancel(appointment: DecoratedAppointment): boolean {
  return !appointment.isPast && ACTIVE.includes(appointment.status);
}

// A change the API can refuse for a reason worth telling the patient, such as
// "Cannot cancel an appointment that has already started or passed". call()
// throws the body away on failure, so these read the response themselves and
// pass the API's own message through.
async function mutate(path: string, init: RequestInit): Promise<{ error: string | null }> {
  const token = await getSessionToken();

  const response = await fetch(`${process.env.API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  }).catch(() => null);

  if (!response) return { error: "Could not reach the server. Please try again." };
  if (response.ok) return { error: null };

  const body = await response.json().catch(() => null);
  // An empty string still means "failed", just with nothing to say. null is
  // reserved for success, so a silent refusal is never mistaken for one.
  return { error: body?.error?.message ?? "" };
}

export async function cancelAppointment(id: string): Promise<{ error: string | null }> {
  return mutate(`/appointments/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function moveAppointment(
  id: string,
  input: {
    appointmentDate: string;
    startTime: string;
    endTime: string;
    doctorScheduleId: string;
  },
): Promise<{ error: string | null }> {
  return mutate(`/appointments/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function createAppointment(input: {
  doctorProfileId: string;
  clinicId: string;
  serviceId: string;
  doctorScheduleId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason: string;
}): Promise<{ appointment: Appointment | null; error: string | null }> {
  const token = await getSessionToken();

  let response: Response;
  try {
    response = await fetch(`${process.env.API_BASE_URL}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
      cache: "no-store",
    });
  } catch {
    return { appointment: null, error: "Could not reach the server. Please try again." };
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    // 409 is the one worth wording ourselves: it means somebody took the slot
    // between this page rendering and the button being pressed.
    if (response.status === 409) {
      return {
        appointment: null,
        error: "Someone has just booked that time. Please choose another.",
      };
    }
    return {
      appointment: null,
      error: body?.error?.message ?? "The booking could not be saved. Please try again.",
    };
  }

  return { appointment: (body?.data ?? body) as Appointment, error: null };
}
