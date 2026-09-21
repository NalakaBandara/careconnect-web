import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import ProfessionalCard from "@/components/ProfessionalCard";
import type { Professional } from "@/types";

function make(overrides: Partial<Professional> = {}): Professional {
  return {
    id: "1",
    name: "Nalaka Perera",
    specialities: ["Cardiology"],
    yearsOfExperience: 10,
    isVerified: true,
    clinics: [{ id: "1", name: "Test Clinic", city: "Colombo" }],
    summary: "A cardiologist.",
    photo: "/professionals/pro-1.jpg",
    photoAlt: "Nalaka Perera, healthcare professional",
    ...overrides,
  };
}

describe("ProfessionalCard", () => {
  it("shows the name, speciality and clinic", () => {
    render(<ProfessionalCard professional={make()} />);

    expect(screen.getByRole("heading", { name: "Nalaka Perera" })).toBeInTheDocument();
    expect(screen.getByText("Cardiology")).toBeInTheDocument();
    expect(screen.getByText("Test Clinic, Colombo")).toBeInTheDocument();
    expect(screen.getByText("10 years of experience")).toBeInTheDocument();
  });

  it("links to that professional's own profile", () => {
    render(<ProfessionalCard professional={make({ id: "42" })} />);
    expect(screen.getByRole("link", { name: "View profile" })).toHaveAttribute(
      "href",
      "/professionals/42",
    );
  });

  it("gives the photo a description rather than leaving it blank", () => {
    render(<ProfessionalCard professional={make()} />);
    // An image with no alt text is announced as its filename, or skipped.
    expect(screen.getByAltText("Nalaka Perera, healthcare professional")).toBeInTheDocument();
  });

  it("copes with the empty fields the API often returns", () => {
    render(
      <ProfessionalCard
        professional={make({ specialities: [], yearsOfExperience: null, clinics: [] })}
      />,
    );

    // No speciality list, no experience line, and a clinic line that says so
    // rather than a dangling comma.
    expect(screen.getByRole("heading", { name: "Nalaka Perera" })).toBeInTheDocument();
    expect(screen.getByText("Clinic to be confirmed")).toBeInTheDocument();
    expect(screen.queryByText(/years of experience/)).not.toBeInTheDocument();
    expect(screen.queryByText("Specialities")).not.toBeInTheDocument();
  });

  it("lists every speciality a doctor holds, once each", () => {
    render(<ProfessionalCard professional={make({ specialities: ["Cardiology", "ENT"] })} />);
    // getByText throws if it matches twice, so this also guards against the
    // speciality being printed both under the name and again below it.
    expect(screen.getByText("Cardiology, ENT")).toBeInTheDocument();
  });

  it("shows the licence verification the API tracks", () => {
    render(<ProfessionalCard professional={make({ isVerified: true })} />);
    expect(screen.getByText("Licence verified")).toBeInTheDocument();
  });

  it("says nothing about verification when the licence is not verified", () => {
    render(<ProfessionalCard professional={make({ isVerified: false })} />);
    expect(screen.queryByText("Licence verified")).not.toBeInTheDocument();
  });
});
