import { describe, it, expect } from "vitest";

import { applyBookings, findDay, getSlotDays, resolveFreeSlot } from "@/lib/slots";

// Proves the pure half of the setup works: plain functions, no DOM needed.
describe("slot availability", () => {
  const days = getSlotDays("arun-mehta");

  it("generates seven days", () => {
    expect(days).toHaveLength(7);
  });

  it("gives the same answer every time for the same professional", () => {
    // Not a pointless test: if this ever used Math.random(), a slot could look
    // free while the page rendered and taken a moment later.
    expect(getSlotDays("arun-mehta")).toEqual(days);
  });

  it("closes at weekends", () => {
    const weekends = days.filter((day) => day.groups.length === 0);
    expect(weekends.length).toBeGreaterThanOrEqual(2);
    expect(weekends.every((day) => day.freeCount === 0)).toBe(true);
  });

  it("marks a booked slot as taken for everyone", () => {
    const open = days.find((day) => day.freeCount > 0)!;
    const slot = open.groups.flatMap((g) => g.slots).find((s) => !s.taken)!;

    const after = applyBookings(days, (date, time) => date === open.date && time === slot.time);
    const sameDay = findDay(after, open.date)!;

    expect(sameDay.groups.flatMap((g) => g.slots).find((s) => s.time === slot.time)!.taken).toBe(
      true,
    );
    expect(sameDay.freeCount).toBe(open.freeCount - 1);
  });

  it("refuses a slot that is not real", () => {
    const open = days.find((day) => day.freeCount > 0)!;
    expect(resolveFreeSlot(days, open.date, "03:00")).toBeNull();
    expect(resolveFreeSlot(days, "1999-01-01", "09:00")).toBeNull();
  });

  it("refuses a slot once it is booked", () => {
    const open = days.find((day) => day.freeCount > 0)!;
    const slot = open.groups.flatMap((g) => g.slots).find((s) => !s.taken)!;

    expect(resolveFreeSlot(days, open.date, slot.time)).not.toBeNull();

    const after = applyBookings(days, () => true);
    expect(resolveFreeSlot(after, open.date, slot.time)).toBeNull();
  });
});
