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
