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

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isWeekend(iso: string): boolean {
  const date = parse(iso);
  if (!date) return false;
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}
