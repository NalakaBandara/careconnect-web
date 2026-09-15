import type { Service } from "@/types";

export const services: Service[] = [
  {
    slug: "general-consultation",
    name: "General Consultation",
    description:
      "Routine check-ups, ongoing condition reviews and referrals with a general practitioner.",
    speciality: "General Practice",
    includes: ["Health check-up", "Chronic condition review", "Referral letters"],
  },
  {
    slug: "dental-care",
    name: "Dental Care",
    description:
      "Preventive dentistry, examinations and treatment planning for adults and children.",
    speciality: "Dentistry",
    includes: ["Dental examination", "Hygiene and cleaning", "Fillings"],
  },
  {
    slug: "mental-health",
    name: "Mental Health",
    description:
      "Talking therapy and assessment sessions with registered psychologists and counsellors.",
    speciality: "Mental Health",
    includes: ["Initial assessment", "Cognitive behavioural therapy", "Follow-up sessions"],
  },
  {
    slug: "physiotherapy",
    name: "Physiotherapy",
    description:
      "Assessment and rehabilitation for injuries, mobility problems and post-operative recovery.",
    speciality: "Physiotherapy",
    includes: ["Injury assessment", "Rehabilitation plan", "Sports physiotherapy"],
  },
  {
    slug: "dermatology",
    name: "Dermatology",
    description: "Skin, hair and nail consultations including mole checks and long-term skin care.",
    speciality: "Dermatology",
    includes: ["Skin consultation", "Mole and lesion check", "Acne treatment"],
  },
  {
    slug: "womens-health",
    name: "Women's Health",
    description:
      "Screening, contraception advice and pregnancy-related consultations in a private setting.",
    speciality: "Women's Health",
    includes: ["Cervical screening", "Contraception advice", "Antenatal check"],
  },
];

export const serviceNames = services.flatMap((service) => service.includes);
