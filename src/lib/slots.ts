import { longDate, shortDate, shortWeekday, isWeekend, todayIso } from "@/lib/date-format";
import type { SlotDay, SlotGroup } from "@/types";

// The slot GRID is generated: which times a clinic offers, and a stable set of
// times already blocked out for the clinic's own reasons.
//
// It deliberately knows nothing about CareConnect bookings. Those live in the
// appointments store, and are layered on with applyBookings() by the API - so
// a slot that one user has booked shows as taken to everyone else.

export const SLOT_DURATION_MINUTES = 20;

const MORNING_TIMES = ["08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00"];
const EVENING_TIMES = ["17:00", "17:30", "18:00", "18:30"];

// FNV-1a. Any stable hash would do - the point is that the same input always
// gives the same answer. Math.random() here would mean a slot looked free
// while the page rendered and taken a moment later.
function hash(key: string): number {
  let value = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    value ^= key.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function blockedByClinic(professionalId: string, date: string, time: string): boolean {
  return hash(`${professionalId}|${date}|${time}`) % 10 < 3; // roughly 3 in 10
}

function buildGroup(
  label: string,
  times: string[],
  professionalId: string,
  date: string,
): SlotGroup {
  return {
    label,
    slots: times.map((time) => ({ time, taken: blockedByClinic(professionalId, date, time) })),
  };
}

function countFree(groups: SlotGroup[]): number {
  return groups.reduce(
    (total, group) => total + group.slots.filter((slot) => !slot.taken).length,
    0,
  );
}

function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function getSlotDays(professionalId: string, dayCount = 7): SlotDay[] {
  const start = todayIso();
  const days: SlotDay[] = [];

  for (let offset = 0; offset < dayCount; offset += 1) {
    const date = addDays(start, offset);

    const groups = isWeekend(date)
      ? [] // clinics in this demo are closed at weekends
      : [
          buildGroup("Morning", MORNING_TIMES, professionalId, date),
          buildGroup("Evening", EVENING_TIMES, professionalId, date),
        ];

    days.push({
      date,
      weekday: shortWeekday(date),
      dayMonth: shortDate(date),
      longDate: longDate(date),
      freeCount: countFree(groups),
      groups,
    });
  }

  return days;
}

// Layers real bookings over the generated grid. `isBooked` is passed in rather
// than imported, so this file stays free of the appointments store and can be
// used from anywhere.
export function applyBookings(
  days: SlotDay[],
  isBooked: (date: string, time: string) => boolean,
): SlotDay[] {
  return days.map((day) => {
    const groups = day.groups.map((group) => ({
      ...group,
      slots: group.slots.map((slot) => ({
        ...slot,
        taken: slot.taken || isBooked(day.date, slot.time),
      })),
    }));

    return { ...day, groups, freeCount: countFree(groups) };
  });
}

export function findDay(days: SlotDay[], date: string): SlotDay | undefined {
  return days.find((day) => day.date === date);
}

export function firstBookableDay(days: SlotDay[]): SlotDay | undefined {
  return days.find((day) => day.freeCount > 0);
}

// Is this date and time a real, free slot? Never trust a slot that arrived in
// a URL or a form - someone can type ?date=1999-01-01&time=03:00 by hand.
// Returns the day the slot belongs to, or null.
export function resolveFreeSlot(days: SlotDay[], date: string, time: string): SlotDay | null {
  const day = findDay(days, date);
  if (!day) return null;

  const slot = day.groups.flatMap((group) => group.slots).find((candidate) => candidate.time === time);
  if (!slot || slot.taken) return null;

  return day;
}
