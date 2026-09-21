import "server-only";

import type { Clinic, Professional, ProfessionalQuery, Service, Speciality } from "@/types";

// Everything the public directory reads, straight from the CareConnect API.
// These four endpoints are open, so none of this needs a token: a visitor can
// browse without an account, and only signs in to book.

const BASE = () => process.env.API_BASE_URL;

// Most endpoints wrap their payload in { data }, but GET /doctors/:id returns
// the object bare. Rather than remembering which is which at each call site,
// unwrap once here.
function unwrap<T>(body: unknown): T | null {
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  return (body as T) ?? null;
}

async function get<T>(path: string): Promise<T | null> {
  const response = await fetch(`${BASE()}${path}`, {
    // Someone editing the directory should be visible on the next request.
    cache: "no-store",
  }).catch(() => null);

  if (!response?.ok) return null;

  const body = await response.json().catch(() => null);
  return unwrap<T>(body);
}

// The API's doctor shape, before it becomes a Professional.
type ApiDoctor = {
  id: string;
  firstName: string;
  lastName: string;
  profilePhoto: string | null;
  bio: string | null;
  yearsOfExperience: number | null;
  isVerified: boolean;
  specialties?: { id: string; name: string }[];
  clinics?: { id: string; name: string }[];
};

const PLACEHOLDER_PHOTOS = [
  "/professionals/pro-1.jpg",
  "/professionals/pro-2.jpg",
  "/professionals/pro-3.jpg",
  "/professionals/pro-4.jpg",
];

// The API has no photos yet, and a directory of grey boxes is hard to read.
// Picking by id rather than at random keeps a given doctor's picture stable
// between renders, which a random choice would not.
function photoFor(doctor: ApiDoctor): string {
  if (doctor.profilePhoto) return doctor.profilePhoto;

  const index = Number(doctor.id);
  return PLACEHOLDER_PHOTOS[
    (Number.isFinite(index) ? Math.abs(index) : 0) % PLACEHOLDER_PHOTOS.length
  ];
}

// The doctor payload names its clinics but does not say what city they are in,
// so the clinic list is fetched once and used to fill that in.
function toProfessional(doctor: ApiDoctor, clinicsById: Map<string, Clinic>): Professional {
  const name = `${doctor.firstName} ${doctor.lastName}`.trim();

  return {
    id: doctor.id,
    name,
    specialities: (doctor.specialties ?? []).map((speciality) => speciality.name),
    yearsOfExperience: doctor.yearsOfExperience,
    isVerified: Boolean(doctor.isVerified),
    clinics: (doctor.clinics ?? []).map((clinic) => ({
      id: clinic.id,
      name: clinic.name,
      city: clinicsById.get(clinic.id)?.city ?? null,
    })),
    summary: doctor.bio ?? "",
    photo: photoFor(doctor),
    photoAlt: `${name}, healthcare professional`,
  };
}

export async function fetchClinics(): Promise<Clinic[]> {
  const clinics = await get<Clinic[]>("/clinics");
  return clinics ?? [];
}

export async function fetchSpecialities(): Promise<Speciality[]> {
  const specialities = await get<Speciality[]>("/specialties");
  return specialities ?? [];
}

export async function fetchServices(): Promise<Service[]> {
  const services = await get<Service[]>("/services");
  return services ?? [];
}

export async function fetchProfessionals(): Promise<Professional[]> {
  // Both at once rather than one after the other: they do not depend on each
  // other, so waiting for the first before starting the second only adds delay.
  const [doctors, clinics] = await Promise.all([
    get<ApiDoctor[]>("/doctors"),
    fetchClinics(),
  ]);

  const clinicsById = new Map(clinics.map((clinic) => [clinic.id, clinic]));
  return (doctors ?? []).map((doctor) => toProfessional(doctor, clinicsById));
}

export async function fetchProfessional(id: string): Promise<Professional | null> {
  const [doctor, clinics] = await Promise.all([
    get<ApiDoctor>(`/doctors/${encodeURIComponent(id)}`),
    fetchClinics(),
  ]);

  if (!doctor?.id) return null;

  const clinicsById = new Map(clinics.map((clinic) => [clinic.id, clinic]));
  return toProfessional(doctor, clinicsById);
}

// Filtering happens here rather than through the API's own clinicId and
// specialtyId parameters, because the filters show names to the visitor and
// the API wants ids. With a directory this size the difference is not
// measurable; if it grows, this is the single place that changes.
function matches(professional: Professional, query: ProfessionalQuery): boolean {
  const term = query.term.trim().toLowerCase();

  const termMatch =
    term.length === 0 ||
    professional.name.toLowerCase().includes(term) ||
    professional.specialities.some((speciality) => speciality.toLowerCase().includes(term)) ||
    professional.clinics.some((clinic) => clinic.name.toLowerCase().includes(term));

  const specialityMatch =
    query.speciality === "all" || professional.specialities.includes(query.speciality);

  const locationMatch =
    query.location === "all" ||
    professional.clinics.some((clinic) => clinic.city === query.location);

  return termMatch && specialityMatch && locationMatch;
}

export async function filterProfessionals(query: ProfessionalQuery): Promise<Professional[]> {
  const professionals = await fetchProfessionals();
  return professionals.filter((professional) => matches(professional, query));
}

export const emptyQuery: ProfessionalQuery = {
  term: "",
  location: "all",
  speciality: "all",
};

// Turns whatever arrived in the URL into a complete, valid query. Anything
// missing or malformed falls back to "no filter" rather than crashing.
export function queryFromSearchParams(
  params: Record<string, string | string[] | undefined>,
): ProfessionalQuery {
  const read = (key: keyof ProfessionalQuery, fallback: string) => {
    const value = params[key];
    return typeof value === "string" && value.length > 0 ? value : fallback;
  };

  return {
    term: read("term", ""),
    location: read("location", "all"),
    speciality: read("speciality", "all"),
  };
}
