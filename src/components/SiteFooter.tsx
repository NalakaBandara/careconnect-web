import Link from "next/link";

// A plain Server Component. It shows the same links to everyone, so unlike
// SiteHeader it never reads the session - which means it adds nothing to the
// cost of rendering a page.
const COLUMNS = [
  {
    heading: "Browse",
    links: [
      { label: "Find a Professional", href: "/professionals" },
      { label: "Services", href: "/services" },
      { label: "About", href: "/about" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "FAQs", href: "/faqs" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Login", href: "/login" },
      { label: "Register", href: "/register" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms and Conditions", href: "/terms" },
    ],
  },
] as const;

export default function SiteFooter() {
  return (
    // mt-auto pushes the footer to the bottom on short pages. It works because
    // <body> is a flex column with min-h-full.
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,0.65fr)] lg:gap-8">
        <div className="max-w-xs">
          <span className="font-serif text-lg font-semibold">CareConnect</span>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            CareConnect helps people find healthcare professionals and services, review what each
            clinic offers and arrange appointments in one place.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {column.heading}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm hover:text-primary hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-3 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CareConnect. All rights reserved.</p>
          <p>
            CareConnect is not an emergency service. Contact your local emergency service if
            immediate help is required.
          </p>
        </div>
      </div>
    </footer>
  );
}
