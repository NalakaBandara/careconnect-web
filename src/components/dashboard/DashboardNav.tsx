"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// A Client Component only because it needs to know which page you are on.
// usePathname is a hook, and hooks need the client.
export default function DashboardNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const items = [
    { label: "Overview", href: "/dashboard" as const },
    { label: "My Appointments", href: "/dashboard/appointments" as const },
    ...(isAdmin ? [{ label: "Administration", href: "/admin" as const }] : []),
  ];

  return (
    <nav aria-label="Dashboard" className="lg:sticky lg:top-6">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
        {items.map((item) => {
          // Overview must match exactly, or it would light up on every child
          // page. The others match their own subtree, so a detail page keeps
          // its section highlighted.
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

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
