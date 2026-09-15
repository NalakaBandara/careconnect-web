export type Speciality =
  | "General Practice"
  | "Dentistry"
  | "Mental Health"
  | "Physiotherapy"
  | "Dermatology"
  | "Women's Health";

export interface Professional {
  id: string;
  name: string;
  speciality: Speciality;
  qualifications: string;
  clinic: string;
  location: string;
  services: string[];
  availabilitySummary: string;
  generalAvailability: string[];
  summary: string;
  photo: string;
  photoAlt: string;
}

export interface Service {
  slug: string;
  name: string;
  description: string;
  speciality: Speciality;
  includes: string[];
}

export interface Faq {
  question: string;
  answer: string;
}

export interface ProfessionalQuery {
  term: string;
  location: string;
  speciality: string;
  service: string;
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
