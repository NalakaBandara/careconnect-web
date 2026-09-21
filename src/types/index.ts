// Shapes that mirror the CareConnect API. Where a field can be missing there,
// it is optional or nullable here, rather than being invented to keep an older
// shape alive.

export interface Clinic {
  id: string;
  name: string;
  city: string | null;
  addressLine1?: string | null;
  telephone?: string | null;
}

export interface Speciality {
  id: string;
  name: string;
  description?: string | null;
}

// A doctor, in the vocabulary this site uses with patients. The API calls it a
// doctor; the pages and URLs say "professional", which is the word in the
// designs and reads better for a directory that is not only doctors.
export interface Professional {
  id: string;
  name: string;
  // Plural: a doctor can hold several, and the API returns a list.
  specialities: string[];
  yearsOfExperience: number | null;
  // The API verifies a doctor's licence. Patients should see that.
  isVerified: boolean;
  clinics: Clinic[];
  summary: string;
  photo: string;
  photoAlt: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
}

export interface Faq {
  question: string;
  answer: string;
}

export interface ProfessionalQuery {
  term: string;
  location: string; // a clinic city
  speciality: string;
}

// --- Appointment booking ---

export interface Slot {
  time: string; // "09:30"
  taken: boolean;
}

export interface SlotGroup {
  label: string; // "Morning" | "Evening"
  slots: Slot[];
}

export interface SlotDay {
  date: string; // "2026-09-17" - sortable and timezone-proof
  weekday: string; // "Wed"
  dayMonth: string; // "17 Sep"
  longDate: string; // "Wednesday 17 September 2026"
  freeCount: number;
  groups: SlotGroup[];
}

export type AppointmentStatus = "confirmed" | "awaiting" | "cancelled" | "completed";

export interface Appointment {
  reference: string; // "CC-4821-MEH"
  userId: string;
  professionalId: string;
  date: string; // "2026-09-17"
  time: string; // "09:30"
  durationMinutes: number;
  reason: string;
  notes: string;
  contactNumber: string;
  status: AppointmentStatus;
  createdAt: string;
}
