// Dates are carried around as "YYYY-MM-DD" strings, so formatting one must not
// involve a timezone. Building the Date in UTC and reading it back in UTC
// keeps "the 17th" the 17th everywhere.

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

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

function parse(iso: string): Date | null {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

/** "2026-09-17" -> "Thursday 17 September 2026" */
export function longDate(iso: string): string {
  const date = parse(iso);
  if (!date) return iso;
  return `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** "2026-09-17" -> "Thu" */
export function shortWeekday(iso: string): string {
  const date = parse(iso);
  return date ? WEEKDAYS[date.getUTCDay()].slice(0, 3) : "";
}

/** "2026-09-17" -> "17 Sep" */
export function shortDate(iso: string): string {
  const date = parse(iso);
  if (!date) return iso;
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()].slice(0, 3)}`;
}

// "Today" and "now" mean the clinic's today and now, not the server's. The
// server may run in UTC while the clinic is hours ahead or behind, and near
// midnight that puts them on different dates. Set CLINIC_TIME_ZONE to an IANA
// name such as "Europe/London"; that is also the default.
const DEFAULT_TIME_ZONE = "Europe/London";

function clinicNow(now: Date = new Date()): { date: string; time: string } {
  const read = (timeZone: string) => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
    return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
  };

  try {
    return read(process.env.CLINIC_TIME_ZONE || DEFAULT_TIME_ZONE);
  } catch {
    // A misspelt zone name throws. Fall back rather than break every page.
    return read(DEFAULT_TIME_ZONE);
  }
}

export function todayIso(): string {
  return clinicNow().date;
}

/**
 * Has this slot already started? Times are "HH:MM", which compare correctly as
 * text. A slot starting this very minute counts as passed: nobody can get there.
 */
export function slotHasPassed(date: string, time: string, now: Date = new Date()): boolean {
  const current = clinicNow(now);
  if (date !== current.date) return date < current.date;
  return time.slice(0, 5) <= current.time;
}

export function isWeekend(iso: string): boolean {
  const date = parse(iso);
  if (!date) return false;
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}
