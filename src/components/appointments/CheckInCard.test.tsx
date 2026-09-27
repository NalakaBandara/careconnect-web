import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import CheckInCard from "@/components/appointments/CheckInCard";

describe("CheckInCard", () => {
  it("shows the QR code, the reference and the check-in link once confirmed", () => {
    render(<CheckInCard reference="CC-4821-MEH" confirmed />);

    expect(
      screen.getByRole("img", { name: "Check-in QR code for booking CC-4821-MEH" }),
    ).toBeInTheDocument();
    expect(screen.getByText("CC-4821-MEH")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open check-in" })).toHaveAttribute(
      "href",
      "/dashboard/appointments/CC-4821-MEH/check-in",
    );
  });

  // A pending booking has not been accepted, so there is nothing to check in to.
  it("shows no code while the clinic has not confirmed yet", () => {
    render(<CheckInCard reference="CC-4821-MEH" confirmed={false} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText(/once the clinic confirms/i)).toBeInTheDocument();
  });

  it("draws a real QR code, not an empty box", () => {
    render(<CheckInCard reference="CC-4821-MEH" confirmed />);

    const path = screen.getByRole("img").querySelector("path");
    // Every dark square adds one "M" to the path. A real code has well over 100.
    expect((path?.getAttribute("d")?.match(/M/g) ?? []).length).toBeGreaterThan(100);
  });
});
