import "server-only";

import { seedProfessionals } from "@/data/professionals";
import type { Professional } from "@/types";

// TEMPORARY. The live directory, so an admin can add, edit and remove
// professionals before the Express API exists.
//
// In-memory again: edits are lost when the server restarts. Structural
// copy of the seed, not a reference to it, so editing a professional cannot
// quietly mutate the seed data other code may still read.

const professionals: Professional[] = seedProfessionals.map((professional) => ({
  ...professional,
  services: [...professional.services],
  generalAvailability: [...professional.generalAvailability],
}));

export function listProfessionals(): Professional[] {
  return professionals;
}

export function findProfessional(id: string): Professional | undefined {
  return professionals.find((professional) => professional.id === id);
}

// "Dr Arun Mehta" -> "dr-arun-mehta". The id is part of the public URL, so it
// has to be URL-safe and readable, not a random number.
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Appends -2, -3 … rather than rejecting a duplicate name. Two clinics really
// can employ two people with the same name.
export function uniqueId(base: string): string {
  const slug = slugify(base) || "professional";
  if (!findProfessional(slug)) return slug;

  let suffix = 2;
  while (findProfessional(`${slug}-${suffix}`)) suffix += 1;
  return `${slug}-${suffix}`;
}

export function createProfessional(input: Omit<Professional, "id">): Professional {
  const professional: Professional = { ...input, id: uniqueId(input.name) };
  professionals.push(professional);
  return professional;
}

export function updateProfessional(
  id: string,
  input: Omit<Professional, "id">,
): Professional | null {
  const index = professionals.findIndex((professional) => professional.id === id);
  if (index === -1) return null;

  // The id is deliberately NOT regenerated from the new name. It is in the
  // public URL, and links to a profile would break if renaming moved it.
  professionals[index] = { ...input, id };
  return professionals[index];
}

export function deleteProfessional(id: string): boolean {
  const index = professionals.findIndex((professional) => professional.id === id);
  if (index === -1) return false;

  professionals.splice(index, 1);
  return true;
}
