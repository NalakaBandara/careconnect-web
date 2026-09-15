import type { SlotDay, SlotGroup } from "@/types";

// The slot grid is GENERATED, not stored. When the Express API is ready this
// file becomes a fetch and the pages do not change - they only ever see
// SlotDay[].

export const SLOT_DURATION_MINUTES = 20;

const MORNING_TIMES = ["08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00"];
const EVENING_TIMES = ["17:00", "17:30", "18:00", "18:30"];

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTH_NAMES = [
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

function isTaken(professionalId: string, date: string, time: string): boolean {
  return hash(`${professionalId}|${date}|${time}`) % 10 < 3; // roughly 3 in 10
}

// Dates are handled in UTC and carried around as "YYYY-MM-DD". A Date object
// carries a timezone, so the same instant can be the 3rd in one place and the
// 2nd in another. A plain date string cannot drift.
function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function buildGroup(
  label: string,
  times: string[],
  professionalId: string,
  date: string,
): SlotGroup {
  return {
    label,
    slots: times.map((time) => ({ time, taken: isTaken(professionalId, date, time) })),
  };
}

export function getSlotDays(professionalId: string, dayCount = 7): SlotDay[] {
  const now = new Date();
  const days: SlotDay[] = [];

  for (let offset = 0; offset < dayCount; offset += 1) {
    const day = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset),
    );
    const date = toIsoDate(day);
    const weekdayIndex = day.getUTCDay();
    const isWeekend = weekdayIndex === 0 || weekdayIndex === 6;

    const groups = isWeekend
      ? [] // clinics in this demo are closed at weekends
      : [
          buildGroup("Morning", MORNING_TIMES, professionalId, date),
          buildGroup("Evening", EVENING_TIMES, professionalId, date),
        ];

    days.push({
      date,
      weekday: WEEKDAY_NAMES[weekdayIndex].slice(0, 3),
      dayMonth: `${day.getUTCDate()} ${MONTH_NAMES[day.getUTCMonth()].slice(0, 3)}`,
      longDate: `${WEEKDAY_NAMES[weekdayIndex]} ${day.getUTCDate()} ${MONTH_NAMES[day.getUTCMonth()]} ${day.getUTCFullYear()}`,
      freeCount: groups.reduce(
        (total, group) => total + group.slots.filter((slot) => !slot.taken).length,
        0,
      ),
      groups,
    });
  }

  return days;
}

export function findDay(days: SlotDay[], date: string): SlotDay | undefined {
  return days.find((day) => day.date === date);
}

export function firstBookableDay(days: SlotDay[]): SlotDay | undefined {
  return days.find((day) => day.freeCount > 0);
}

// Never trust a slot that arrived in the URL or a form. Someone can type
// ?date=1999-01-01&time=03:00 by hand; this is what stops that becoming a
// booking. Returns the day the slot belongs to, or null if it is not bookable.
export function resolveFreeSlot(
  professionalId: string,
  date: string,
  time: string,
): SlotDay | null {
  const day = findDay(getSlotDays(professionalId), date);
  if (!day) return null;

  const slot = day.groups.flatMap((group) => group.slots).find((candidate) => candidate.time === time);
  if (!slot || slot.taken) return null;

  return day;
}
