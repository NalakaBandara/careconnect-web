"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Managing doctors is being rebuilt against the API, where an admin promotes
// an existing user rather than creating a professional from nothing. The link
// comes back with those pages; a link to a route that does not exist is worse
// than no link.
const ITEMS = [{ label: "Overview", href: "/admin" as const }];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Administration">
      <p className="px-3 pb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        Admin
      </p>
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
        {ITEMS.map((item) => {
          // Overview matches exactly, or it would stay lit on every child page.
          const isActive =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={
                  "block rounded-md px-3 py-2 text-sm whitespace-nowrap " +
                  (isActive
                    ? "bg-surface font-medium text-foreground"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground")
                }
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
