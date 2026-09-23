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
  // "ACTIVE" or "INACTIVE". A retired service is kept rather than deleted, so
  // appointments already booked against it still make sense.
  status?: string;
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
  endTime?: string; // "10:00", from the API's own slot length
  // Which of the doctor's weekly schedules this slot came from. The API wants
  // it back when the appointment is booked.
  scheduleId?: string;
}

export interface SlotGroup {
  label: string; // "Morning" | "Afternoon"
  slots: Slot[];
}

export interface SlotDay {
  date: string; // "2026-09-17" - sortable and timezone-proof
  weekday: string; // "Wed"
  dayMonth: string; // "17 Sep"
  longDate: string; // "Wednesday 17 September 2026"
  freeCount: number;
  groups: SlotGroup[];
  /**
   * The API did not answer for this day, so whether anything is free is
   * unknown. Kept separate from freeCount: 0, because telling somebody a clinic
   * is fully booked when the truth is that the request failed sends them away
   * for no reason.
   */
  unknown?: boolean;
}

// The API's own statuses, uppercase.
export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Appointment {
  id: string;
  bookingReference: string;
  doctor: { id: string; firstName: string; lastName: string };
  clinic: { id: string; name: string };
  service: { id: string; name: string; durationMinutes: number };
  doctorScheduleId: string;
  appointmentDate: string; // "2026-09-28"
  startTime: string; // "09:00:00"
  endTime: string;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  createdAt: string;
}
