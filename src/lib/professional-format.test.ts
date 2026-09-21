import { describe, it, expect } from "vitest";

import {
  clinicLine,
  experienceLine,
  primarySpeciality,
  specialityLine,
} from "@/lib/professional-format";
import type { Professional } from "@/types";

function make(overrides: Partial<Professional> = {}): Professional {
  return {
    id: "1",
    name: "Nalaka Perera",
    specialities: ["Cardiology"],
    yearsOfExperience: 10,
    isVerified: true,
    clinics: [{ id: "1", name: "Test Clinic", city: "Colombo" }],
    summary: "",
    photo: "/professionals/pro-1.jpg",
    photoAlt: "",
    ...overrides,
  };
}

// The API leaves plenty of these fields empty or null, so most of these tests
// are about what the page says when there is nothing to say.
describe("clinicLine", () => {
  it("joins the clinic and its city", () => {
    expect(clinicLine(make())).toBe("Test Clinic, Colombo");
  });

  it("drops the comma when the city is unknown", () => {
    expect(clinicLine(make({ clinics: [{ id: "1", name: "Test Clinic", city: null }] }))).toBe(
      "Test Clinic",
    );
  });

  it("says something sensible when no clinic is listed", () => {
    expect(clinicLine(make({ clinics: [] }))).toBe("Clinic to be confirmed");
  });

  it("shows the first clinic when there are several", () => {
    const professional = make({
      clinics: [
        { id: "1", name: "First Clinic", city: "Colombo" },
        { id: "2", name: "Second Clinic", city: "Kandy" },
      ],
    });
    expect(clinicLine(professional)).toBe("First Clinic, Colombo");
  });
});

describe("specialities", () => {
  it("lists them all where there is room", () => {
    expect(specialityLine(make({ specialities: ["Cardiology", "ENT"] }))).toBe("Cardiology, ENT");
  });

  it("uses only the first where there is not", () => {
    expect(primarySpeciality(make({ specialities: ["Cardiology", "ENT"] }))).toBe("Cardiology");
  });

  it("falls back rather than printing nothing", () => {
    expect(primarySpeciality(make({ specialities: [] }))).toBe("General practice");
    expect(specialityLine(make({ specialities: [] }))).toBe("");
  });
});

describe("experienceLine", () => {
  it("puts the year in the singular when there is one", () => {
    expect(experienceLine(make({ yearsOfExperience: 1 }))).toBe("1 year of experience");
    expect(experienceLine(make({ yearsOfExperience: 10 }))).toBe("10 years of experience");
  });

  it("says nothing at all when the API has no figure", () => {
    // Returning null lets the page leave the line out entirely, rather than
    // printing "0 years of experience" next to a consultant.
    expect(experienceLine(make({ yearsOfExperience: null }))).toBeNull();
    expect(experienceLine(make({ yearsOfExperience: 0 }))).toBeNull();
  });
});
