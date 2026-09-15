import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import StatusBadge from "@/components/appointments/StatusBadge";

// Proves the component half of the setup works: rendering into jsdom and
// querying the result the way a user would find it.
describe("StatusBadge", () => {
  it("shows a readable label rather than the raw status", () => {
    render(<StatusBadge status="awaiting" />);
    // "awaiting" is our internal word; "Awaiting clinic" is what a patient reads.
    expect(screen.getByText("Awaiting clinic")).toBeInTheDocument();
  });

  it("labels every status we can store", () => {
    const labels = {
      confirmed: "Confirmed",
      awaiting: "Awaiting clinic",
      completed: "Completed",
      cancelled: "Cancelled",
    } as const;

    for (const [status, label] of Object.entries(labels)) {
      const { unmount } = render(
        <StatusBadge status={status as keyof typeof labels} />,
      );
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });
});
