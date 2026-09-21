import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => searchParams,
}));

import ProfessionalFilters from "@/components/professionals/ProfessionalFilters";
import type { ProfessionalQuery } from "@/types";

// Defined here rather than imported from @/lib/directory, which is marked
// server-only and rightly refuses to load in a client-side test.
const emptyQuery: ProfessionalQuery = { term: "", location: "all", speciality: "all" };

beforeEach(() => {
  push.mockReset();
  searchParams = new URLSearchParams();
});

const options = {
  specialities: ["Cardiology", "ENT"],
  locations: ["Colombo", "San Francisco"],
};

describe("ProfessionalFilters", () => {
  it("labels each dropdown", () => {
    render(<ProfessionalFilters query={emptyQuery} {...options} />);
    expect(screen.getByLabelText("Speciality")).toBeInTheDocument();
    expect(screen.getByLabelText("Location")).toBeInTheDocument();
  });

  it("offers the options it was given, plus an 'all' choice", () => {
    render(<ProfessionalFilters query={emptyQuery} {...options} />);

    const speciality = screen.getByLabelText("Speciality");
    expect(speciality).toHaveValue("all");
    expect(screen.getByRole("option", { name: "Cardiology" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "All specialities" })).toBeInTheDocument();
  });

  it("puts the choice in the URL rather than holding it in state", async () => {
    render(<ProfessionalFilters query={emptyQuery} {...options} />);

    await userEvent.selectOptions(screen.getByLabelText("Speciality"), "Cardiology");

    // This is the whole design: the URL is the filter. That is what makes the
    // back button work and a filtered view shareable.
    expect(push).toHaveBeenCalledWith("/professionals?speciality=Cardiology", { scroll: false });
  });

  it("keeps filters that are already applied", async () => {
    searchParams = new URLSearchParams("speciality=Cardiology");
    render(
      <ProfessionalFilters
        query={{ ...emptyQuery, speciality: "Cardiology" }}
        {...options}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText("Location"), "Colombo");

    const url = push.mock.calls[0][0] as string;
    expect(url).toContain("speciality=Cardiology");
    expect(url).toContain("location=Colombo");
  });

  it("removes a filter from the URL when it is set back to 'all'", async () => {
    searchParams = new URLSearchParams("speciality=Cardiology");
    render(
      <ProfessionalFilters
        query={{ ...emptyQuery, speciality: "Cardiology" }}
        {...options}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText("Speciality"), "all");

    // Otherwise an unfiltered view reads ?speciality=all&location=all, which
    // is noise in a link somebody might share.
    expect(push).toHaveBeenCalledWith("/professionals?", { scroll: false });
  });

  it("does not jump the page to the top when a filter changes", async () => {
    render(<ProfessionalFilters query={emptyQuery} {...options} />);
    await userEvent.selectOptions(screen.getByLabelText("Location"), "Colombo");

    expect(push.mock.calls[0][1]).toEqual({ scroll: false });
  });
});
