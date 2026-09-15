// The main nav, in one place so the desktop header and the mobile menu can
// never drift apart.
export const mainNav = [
  { label: "Home", href: "/" },
  { label: "Find a Professional", href: "/professionals" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "FAQs", href: "/faqs" },
  { label: "Contact", href: "/contact" },
] as const;
