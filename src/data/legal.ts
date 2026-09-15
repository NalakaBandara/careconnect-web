// Copy for the Privacy and Terms pages. A block with no heading is an opening
// paragraph; the rest are heading + body pairs.

export interface LegalBlock {
  heading?: string;
  body: string;
}

export const privacyBlocks: LegalBlock[] = [
  {
    body: "CareConnect collects only the information needed to operate the directory and manage appointments: your name, contact details and the appointments you request.",
  },
  {
    heading: "What is public",
    body: "Professional profiles, clinic locations, services and general availability are public. Patient accounts, appointment history and messages are never published.",
  },
  {
    heading: "Sharing with clinics",
    body: "When you request an appointment, the clinic you selected receives the details needed to confirm it. Information is not sold or shared for marketing.",
  },
  {
    heading: "Your choices",
    body: "You can request a copy of your data or ask for your account to be deleted at any time by contacting support@careconnect.health.",
  },
];

export const termsBlocks: LegalBlock[] = [
  {
    body: "CareConnect provides a directory of healthcare professionals and a way to request appointments. Clinical care is provided by the practitioner or clinic you choose, not by CareConnect.",
  },
  {
    heading: "Using the directory",
    body: "Profile details are supplied by clinics and reviewed before publication. Availability shown on a profile is indicative; the clinic confirms the final appointment time.",
  },
  {
    heading: "Accounts",
    body: "You are responsible for keeping your login details secure and for the accuracy of the information you provide when requesting an appointment.",
  },
  {
    heading: "Urgent care",
    body: "CareConnect is not an emergency service. Contact your local emergency service if immediate help is required.",
  },
];

export const aboutParagraphs = [
  "We work with independent clinics and practices that keep their own listings current. Each profile shows the practitioner's qualifications, the services they provide, the clinic they work from and when appointments are generally available.",
  "Browsing is deliberately open. Anyone can search the directory, compare specialities and read a full public profile before deciding whether to create an account. An account is only required at the point of requesting an appointment, so that appointment details and personal information stay private.",
  "CareConnect does not rank or score practitioners, and does not publish patient reviews. The aim is accurate, verifiable practice information that helps people make a considered choice about their care.",
];

export const contactDetails = {
  email: "support@careconnect.health",
  telephone: "0161 496 0188, Monday to Friday, 09:00 – 17:00",
  office: "2nd Floor, Kingsway House, 41 Peter Street, Manchester M2 5GB",
};
