import { professionals } from "@/data/professionals";
import type { Professional, ProfessionalQuery } from "@/types";

// "all" is the sentinel meaning "no filter applied" - it keeps every filter a
// plain string, so it survives a round trip through the URL unchanged.
export const emptyQuery: ProfessionalQuery = {
  term: "",
  location: "all",
  speciality: "all",
  service: "all",
};

function matches(professional: Professional, query: ProfessionalQuery): boolean {
  const term = query.term.trim().toLowerCase();
  const termMatch =
    term.length === 0 ||
    professional.name.toLowerCase().includes(term) ||
    professional.speciality.toLowerCase().includes(term) ||
    professional.services.some((service) => service.toLowerCase().includes(term));

  const locationMatch = query.location === "all" || professional.location === query.location;
  const specialityMatch = query.speciality === "all" || professional.speciality === query.speciality;
  const serviceMatch = query.service === "all" || professional.services.includes(query.service);

  return termMatch && locationMatch && specialityMatch && serviceMatch;
}

// Pure function, no delay, no network. When the Express API is ready this
// becomes a fetch and the callers do not change.
export function filterProfessionals(query: ProfessionalQuery): Professional[] {
  return professionals.filter((professional) => matches(professional, query));
}

// Turns whatever arrived in the URL into a complete, valid query object.
// Anything missing or malformed falls back to "no filter" rather than crashing.
export function queryFromSearchParams(
  params: Record<string, string | string[] | undefined>,
): ProfessionalQuery {
  const read = (key: keyof ProfessionalQuery, fallback: string) => {
    const value = params[key];
    if (typeof value === "string" && value.length > 0) return value;
    return fallback;
  };

  return {
    term: read("term", ""),
    location: read("location", "all"),
    speciality: read("speciality", "all"),
    service: read("service", "all"),
  };
}
