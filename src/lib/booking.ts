import "server-only";

import { longDate, shortDate, shortWeekday, slotHasPassed, todayIso } from "@/lib/date-format";
import { getSessionToken } from "@/lib/session";
import type { SlotDay, SlotGroup } from "@/types";

// Availability, from the API. Both endpoints used here need a token, which is
// fine: booking is behind a login anyway.

export interface DoctorSchedule {
  id: string;
  clinicId: string;
  dayOfWeek: string; // "MONDAY"
  startTime: string; // "09:00:00"
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
}

// The API's slot, before it becomes ours.
type ApiSlot = { startTime: string; endTime: string; available: boolean };

const WEEKDAY_NAMES = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

async function get<T>(path: string): Promise<T | null> {
  const token = await getSessionToken();

  const response = await fetch(`${process.env.API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    // Availability changes the moment anybody books, so it must never be
    // served from a cache.
    cache: "no-store",
  }).catch(() => null);

  if (!response?.ok) return null;
  return (await response.json().catch(() => null)) as T | null;
}

export async function fetchSchedules(doctorId: string): Promise<DoctorSchedule[]> {
  const body = await get<{ data: DoctorSchedule[] }>(
    `/doctors/${encodeURIComponent(doctorId)}/schedules`,
  );
  return (body?.data ?? []).filter((schedule) => schedule.isActive);
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function weekdayOf(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return WEEKDAY_NAMES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/** "09:00:00" -> "09:00". The seconds are never shown. */
function toDisplayTime(value: string): string {
  return value.slice(0, 5);
}

// The API groups nothing, it returns a flat list of times. The design shows
// them under Morning and Afternoon headings, so they are grouped here.
function groupSlots(
  slots: ApiSlot[],
  scheduleFor: (time: string) => string | undefined,
): SlotGroup[] {
  const groups: SlotGroup[] = [];

  const morning = slots.filter((slot) => Number(slot.startTime.slice(0, 2)) < 12);
  const afternoon = slots.filter((slot) => Number(slot.startTime.slice(0, 2)) >= 12);

  for (const [label, list] of [
    ["Morning", morning],
    ["Afternoon", afternoon],
  ] as const) {
    if (list.length === 0) continue;

    groups.push({
      label,
      slots: list.map((slot) => ({
        time: toDisplayTime(slot.startTime),
        taken: !slot.available,
        endTime: toDisplayTime(slot.endTime),
        scheduleId: scheduleFor(slot.startTime),
      })),
    });
  }

  return groups;
}

/**
 * The next `dayCount` days of availability at one clinic.
 *
 * Only days the doctor actually works are requested. The API answers one day
 * per request, so asking for all seven would mean four wasted round trips for
 * a doctor who works three days a week.
 */
export async function fetchAvailability(
  doctorId: string,
  clinicId: string,
  dayCount = 14,
): Promise<SlotDay[]> {
  const schedules = await clinicSchedules(doctorId, clinicId);
  if (schedules.length === 0) return [];

  // The clinic's today, not the server's. See todayIso.
  const today = todayIso();
  const dates = Array.from({ length: dayCount }, (_, i) => addDays(today, i));

  // One request for the whole fortnight. The API used to answer a single day
  // at a time, so this page cost one request per working day, six for two
  // weeks, against a limit of 30 a minute: about four booking views a minute
  // for the entire site. fromDate and toDate make it one.
  const body = await get<{ days: { date: string; slots: ApiSlot[] }[] }>(
    `/doctors/${encodeURIComponent(doctorId)}/available-slots?clinicId=${encodeURIComponent(
      clinicId,
    )}&fromDate=${dates[0]}&toDate=${dates[dates.length - 1]}`,
  );
  const slotsByDate = new Map((body?.days ?? []).map((day) => [day.date, day.slots]));

  // The range includes days the doctor does not work, as empty lists. Those
  // are left out rather than shown as "Full", which would imply bookings.
  return dates
    .filter((date) => schedules.some((schedule) => schedule.dayOfWeek === weekdayOf(date)))
    // No answer at all leaves every day unknown, never full.
    .map((date) => toSlotDay(date, body === null ? null : (slotsByDate.get(date) ?? []), schedules));
}

/**
 * One day only, for the re-check just before a booking or a move is saved.
 * Asking for the fortnight to verify one time would be wasteful.
 */
export async function fetchDayAvailability(
  doctorId: string,
  clinicId: string,
  date: string,
): Promise<SlotDay | null> {
  const schedules = await clinicSchedules(doctorId, clinicId);
  if (!schedules.some((schedule) => schedule.dayOfWeek === weekdayOf(date))) return null;

  const body = await get<{ slots: ApiSlot[] }>(
    `/doctors/${encodeURIComponent(doctorId)}/available-slots?clinicId=${encodeURIComponent(
      clinicId,
    )}&date=${date}`,
  );
  return toSlotDay(date, body === null ? null : (body.slots ?? []), schedules);
}

async function clinicSchedules(doctorId: string, clinicId: string) {
  return (await fetchSchedules(doctorId)).filter((schedule) => schedule.clinicId === clinicId);
}

/** One day's slots in the shape the picker uses. null means the API did not answer. */
function toSlotDay(date: string, slots: ApiSlot[] | null, schedules: DoctorSchedule[]): SlotDay {
  // Which schedule covers a given time, so a booking can name it. A doctor can
  // have a morning and an evening schedule on the same day.
  const scheduleFor = (time: string) =>
    schedules.find(
      (schedule) =>
        schedule.dayOfWeek === weekdayOf(date) &&
        time >= schedule.startTime &&
        time < schedule.endTime,
    )?.id;

  const common = {
    date,
    weekday: shortWeekday(date),
    dayMonth: shortDate(date),
    longDate: longDate(date),
  };

  // No answer at all. Falling back to an empty list here would render the day
  // as "Full", which is a different claim entirely and one we cannot support.
  if (slots === null) {
    return { ...common, freeCount: 0, groups: [], unknown: true } satisfies SlotDay;
  }

  // The API still lists times earlier today that have already gone, so a
  // patient at 3pm was offered 9am. They are dropped rather than shown as
  // taken, because "taken" would claim somebody booked them. Doing it here
  // also means the booking re-check treats a passed time as unavailable.
  const upcoming = slots.filter((slot) => !slotHasPassed(date, slot.startTime));
  const groups = groupSlots(upcoming, scheduleFor);

  return {
    ...common,
    freeCount: groups.reduce(
      (total, group) => total + group.slots.filter((slot) => !slot.taken).length,
      0,
    ),
    groups,
  } satisfies SlotDay;
}

export function findDay(days: SlotDay[], date: string): SlotDay | undefined {
  return days.find((day) => day.date === date);
}

export function firstBookableDay(days: SlotDay[]): SlotDay | undefined {
  return days.find((day) => day.freeCount > 0 && !day.unknown);
}

/**
 * The same check as resolveFreeSlot, but it says WHY when the answer is no.
 *
 * Both the booking and the reschedule actions re-check the slot before writing,
 * because the form may have sat open for a while. They used to treat every
 * negative answer as "somebody took it", so a re-check that could not reach the
 * API told the patient their slot was gone and sent them to pick another one
 * that would fail the same way. The API allows 30 requests a minute and a
 * re-check costs one per working day, so this is easy to hit.
 */
export type SlotCheck =
  | { status: "free"; scheduleId: string; endTime: string }
  | { status: "taken" }
  | { status: "unknown" };

export function checkSlot(day: SlotDay | null, time: string): SlotCheck {
  // Nothing known about the day at all, or the request for it failed.
  if (!day || day.unknown) return { status: "unknown" };

  const slot = day.groups.flatMap((group) => group.slots).find((s) => s.time === time);
  if (!slot || slot.taken || !slot.scheduleId || !slot.endTime) return { status: "taken" };

  return { status: "free", scheduleId: slot.scheduleId, endTime: slot.endTime };
}

/**
 * Is this date and time genuinely free? Never trust a slot that arrived in a
 * URL or a form: someone can type ?date=1999-01-01&time=03:00 by hand.
 */
export function resolveFreeSlot(days: SlotDay[], date: string, time: string) {
  const day = findDay(days, date);
  if (!day) return null;

  const slot = day.groups.flatMap((group) => group.slots).find((s) => s.time === time);
  if (!slot || slot.taken) return null;

  return { day, slot };
}
