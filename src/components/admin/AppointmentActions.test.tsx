import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// The real actions talk to the API; these tests are only about which buttons
// are offered.
vi.mock("@/app/(protected)/admin/appointments/actions", () => ({
  setStatusAction: vi.fn(),
  checkInAction: vi.fn(),
}));

import AppointmentActions from "@/components/admin/AppointmentActions";

const buttons = () => screen.queryAllByRole("button").map((b) => b.textContent);

describe("AppointmentActions", () => {
  it("offers confirm and cancel on an upcoming pending appointment", () => {
    render(<AppointmentActions id="1" status="PENDING" />);
    expect(buttons()).toEqual(["Confirm", "Cancel"]);
  });

  it("offers completed, missed, cancel and check-in on an upcoming confirmed one", () => {
    render(<AppointmentActions id="1" status="CONFIRMED" />);
    expect(buttons()).toEqual(["Mark completed", "Mark missed", "Cancel", "Check in"]);
  });

  // The date has gone, so there is nothing to confirm or cancel any more.
  it("offers nothing on a past appointment that was never confirmed", () => {
    render(<AppointmentActions id="1" status="PENDING" isPast />);
    expect(buttons()).toEqual([]);
    expect(screen.getByText("No further action")).toBeInTheDocument();
  });

  it("only lets a past confirmed appointment be recorded as completed or missed", () => {
    render(<AppointmentActions id="1" status="CONFIRMED" isPast />);
    expect(buttons()).toEqual(["Mark completed", "Mark missed"]);
  });
});
