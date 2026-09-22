import "server-only";

import { longDate, shortDate, shortWeekday } from "@/lib/date-format";
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
  const schedules = (await fetchSchedules(doctorId)).filter(
    (schedule) => schedule.clinicId === clinicId,
  );

  if (schedules.length === 0) return [];

  const today = new Date().toISOString().slice(0, 10);
  const dates = Array.from({ length: dayCount }, (_, i) => addDays(today, i));

  // Which schedule covers a given time, so a booking can name it. A doctor can
  // have a morning and an evening schedule on the same day.
  const scheduleFinder = (date: string) => (time: string) =>
    schedules.find(
      (schedule) =>
        schedule.dayOfWeek === weekdayOf(date) &&
        time >= schedule.startTime &&
        time < schedule.endTime,
    )?.id;

  const working = dates.filter((date) =>
    schedules.some((schedule) => schedule.dayOfWeek === weekdayOf(date)),
  );

  // In parallel: each day is an independent request, so doing them in sequence
  // would make the page wait for the sum rather than the slowest.
  const results = await Promise.all(
    working.map(async (date) => {
      const body = await get<{ slots: ApiSlot[] }>(
        `/doctors/${encodeURIComponent(doctorId)}/available-slots?clinicId=${encodeURIComponent(
          clinicId,
        )}&date=${date}`,
      );

      const groups = groupSlots(body?.slots ?? [], scheduleFinder(date));

      return {
        date,
        weekday: shortWeekday(date),
        dayMonth: shortDate(date),
        longDate: longDate(date),
        freeCount: groups.reduce(
          (total, group) => total + group.slots.filter((slot) => !slot.taken).length,
          0,
        ),
        groups,
      } satisfies SlotDay;
    }),
  );

  return results;
}

export function findDay(days: SlotDay[], date: string): SlotDay | undefined {
  return days.find((day) => day.date === date);
}

export function firstBookableDay(days: SlotDay[]): SlotDay | undefined {
  return days.find((day) => day.freeCount > 0);
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
