import type { Professional } from "@/types";

// Turning the API's shape into the short lines the design asks for. Kept out
// of the components so every card, profile and summary words it the same way,
// and out of directory.ts so client components can use it too.

// A doctor can work at several clinics. Where the design has room for one, the
// first is shown and the rest are counted.
export function primaryClinic(professional: Professional) {
  return professional.clinics[0];
}

/** "Test Clinic, San Francisco", or just the clinic if the city is unknown. */
export function clinicLine(professional: Professional): string {
  const clinic = primaryClinic(professional);
  if (!clinic) return "Clinic to be confirmed";
  return clinic.city ? `${clinic.name}, ${clinic.city}` : clinic.name;
}

/** "Cardiology" or "Cardiology, ENT". Empty string if none are recorded. */
export function specialityLine(professional: Professional): string {
  return professional.specialities.join(", ");
}

/** The single speciality used where only one will fit. */
export function primarySpeciality(professional: Professional): string {
  return professional.specialities[0] ?? "General practice";
}

/** "10 years of experience", or nothing when the API has no figure. */
export function experienceLine(professional: Professional): string | null {
  const years = professional.yearsOfExperience;
  if (years === null || years <= 0) return null;
  return `${years} ${years === 1 ? "year" : "years"} of experience`;
}
