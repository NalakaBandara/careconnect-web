import type { Professional, Speciality } from "@/types";

// "as const satisfies" gives two things at once: the values stay literal types
// (so zod can build an enum from them) and they are still checked against
// Speciality, so a typo here is a type error rather than a new speciality.
export const specialities = [
  "General Practice",
  "Dentistry",
  "Mental Health",
  "Physiotherapy",
  "Dermatology",
  "Women's Health",
] as const satisfies readonly Speciality[];

export const locations = [
  "Manchester",
  "Leeds",
  "Birmingham",
  "Bristol",
  "Glasgow",
] as const;

// The starting data. The live list lives in src/lib/professional-store.ts,
// which seeds itself from this and can then be edited by an admin.
export const seedProfessionals: Professional[] = [
  {
    id: "arun-mehta",
    name: "Dr Arun Mehta",
    speciality: "General Practice",
    qualifications: "MBBS, MRCGP",
    clinic: "Northgate Family Practice",
    location: "Manchester",
    services: ["Health check-up", "Chronic condition review", "Referral letters"],
    availabilitySummary: "Weekday mornings and Thursday evenings",
    generalAvailability: ["Monday to Friday, 08:30 – 12:30", "Thursday, 17:00 – 19:30"],
    summary:
      "Arun has worked in community general practice for twelve years, with a particular interest in long-term condition management such as diabetes and hypertension. He sees patients of all ages and works closely with local pharmacies and district nursing teams.",
    photo: "/professionals/pro-1.jpg",
    photoAlt: "Dr Arun Mehta, general practitioner, wearing a white clinical coat",
  },
  {
    id: "grace-owusu",
    name: "Grace Owusu",
    speciality: "Dentistry",
    qualifications: "BDS, MFDS RCS",
    clinic: "Riverside Dental Studio",
    location: "Leeds",
    services: ["Dental examination", "Hygiene and cleaning", "Fillings"],
    availabilitySummary: "Tuesday to Saturday appointments",
    generalAvailability: ["Tuesday to Friday, 09:00 – 17:00", "Saturday, 09:00 – 13:00"],
    summary:
      "Grace is a general dentist who focuses on preventive care and treating patients who feel anxious about dental visits. She explains each treatment step clearly and offers extended Saturday appointments for people who work during the week.",
    photo: "/professionals/pro-2.jpg",
    photoAlt: "Grace Owusu, dentist, wearing light blue clinical scrubs",
  },
  {
    id: "elena-marsh",
    name: "Dr Elena Marsh",
    speciality: "Mental Health",
    qualifications: "DClinPsy, HCPC registered",
    clinic: "Ashcroft Wellbeing Centre",
    location: "Bristol",
    services: ["Initial assessment", "Cognitive behavioural therapy", "Follow-up sessions"],
    availabilitySummary: "Weekday afternoons, in person or online",
    generalAvailability: ["Monday, Wednesday, Friday, 13:00 – 18:00", "Online sessions available"],
    summary:
      "Elena is a clinical psychologist working with adults experiencing anxiety, low mood and work-related stress. Sessions begin with an assessment appointment so that a therapy plan can be agreed together before treatment starts.",
    photo: "/professionals/pro-3.jpg",
    photoAlt: "Dr Elena Marsh, clinical psychologist, in a grey knitted sweater",
  },
  {
    id: "kenji-tanaka",
    name: "Kenji Tanaka",
    speciality: "Physiotherapy",
    qualifications: "BSc (Hons) Physiotherapy, MCSP",
    clinic: "Meadow Lane Rehabilitation",
    location: "Birmingham",
    services: ["Injury assessment", "Rehabilitation plan", "Sports physiotherapy"],
    availabilitySummary: "Early mornings and weekday evenings",
    generalAvailability: ["Monday to Thursday, 07:00 – 10:00", "Monday to Wednesday, 16:00 – 20:00"],
    summary:
      "Kenji supports people recovering from sports injuries and orthopaedic surgery. Each appointment includes a movement assessment and a home exercise plan, reviewed at follow-up visits to track progress.",
    photo: "/professionals/pro-4.jpg",
    photoAlt: "Kenji Tanaka, physiotherapist, wearing a dark polo shirt",
  },
];
