import { describe, it, expect } from "vitest";

import { isWeekend, longDate, shortDate, shortWeekday, slotHasPassed } from "@/lib/date-format";

// Dates are carried as "YYYY-MM-DD" strings precisely so no timezone can shift
// them. These tests are what stops someone "simplifying" that back to a Date.
describe("date formatting", () => {
  it("writes a full date the way the designs do", () => {
    expect(longDate("2026-09-17")).toBe("Thursday 17 September 2026");
    expect(longDate("2026-01-01")).toBe("Thursday 1 January 2026");
    expect(longDate("2026-12-31")).toBe("Thursday 31 December 2026");
  });

  it("does not shift the day whatever the machine's timezone is", () => {
    // Parsed as local time, "2026-09-17" becomes the 16th anywhere west of
    // UTC. Building and reading it in UTC is what prevents that.
    expect(longDate("2026-09-17")).toContain("17 September");
    expect(shortDate("2026-09-17")).toBe("17 Sep");
    expect(shortWeekday("2026-09-17")).toBe("Thu");
  });

  it("knows which days are the weekend", () => {
    expect(isWeekend("2026-09-19")).toBe(true); // Saturday
    expect(isWeekend("2026-09-20")).toBe(true); // Sunday
    expect(isWeekend("2026-09-21")).toBe(false); // Monday
    expect(isWeekend("2026-09-18")).toBe(false); // Friday
  });

  it("hands back nonsense unchanged rather than crashing", () => {
    // A bad date should show oddly, not take the page down with it.
    expect(longDate("not-a-date")).toBe("not-a-date");
    expect(shortDate("")).toBe("");
  });

  it("sorts correctly as plain text, which is why the format was chosen", () => {
    const dates = ["2026-12-01", "2026-01-15", "2026-09-17"];
    expect([...dates].sort()).toEqual(["2026-01-15", "2026-09-17", "2026-12-01"]);
  });
});

describe("slotHasPassed", () => {
  // 09:00 UTC on 25 September 2026 is 14:30 in Colombo (UTC+5:30).
  const now = new Date("2026-09-25T09:00:00Z");

  it("treats an earlier time today as passed", () => {
    expect(slotHasPassed("2026-09-25", "09:00", now)).toBe(true);
  });

  it("treats a later time today as still available", () => {
    expect(slotHasPassed("2026-09-25", "16:00", now)).toBe(false);
  });

  it("uses the clinic's clock, not UTC", () => {
    // 12:00 is after 09:00 UTC but before 14:30 in Colombo, so it has passed.
    expect(slotHasPassed("2026-09-25", "12:00", now)).toBe(true);
  });

  it("counts a slot starting this minute as passed", () => {
    expect(slotHasPassed("2026-09-25", "14:30", now)).toBe(true);
  });

  it("compares whole days before looking at times", () => {
    expect(slotHasPassed("2026-09-24", "23:00", now)).toBe(true);
    expect(slotHasPassed("2026-09-26", "08:00", now)).toBe(false);
  });

  it("accepts the API's HH:MM:SS format", () => {
    expect(slotHasPassed("2026-09-25", "09:00:00", now)).toBe(true);
  });
});
