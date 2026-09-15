import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import StatusBadge from "@/components/appointments/StatusBadge";
import { buttonClasses } from "@/components/Button";
import { fetchProfessional } from "@/lib/professionals";
import { fetchAppointments, splitAppointments } from "@/lib/appointments";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

const QUICK_ACTIONS = [
  {
    href: "/professionals" as const,
    title: "Find care",
    description: "Search clinics, doctors and services",
  },
  {
    href: "/dashboard/appointments" as const,
    title: "My appointments",
    description: "View, reschedule or cancel bookings",
  },
  {
    href: "/services" as const,
    title: "Browse services",
    description: "See what each service covers",
  },
];

export default async function DashboardPage() {
  // Safe to assert: the layout above already redirected anyone without a session.
  const user = (await getSession())!;

  const { upcoming } = splitAppointments(await fetchAppointments());
  const next = upcoming[0]; // the list arrives sorted, soonest first
  const nextProfessional = next ? await fetchProfessional(next.professionalId) : null;

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold sm:text-3xl">
        Welcome back{user.email ? `, ${user.email.split("@")[0]}` : ""}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {upcoming.length === 0
          ? "You have no upcoming appointments."
          : `You have ${upcoming.length} upcoming appointment${upcoming.length === 1 ? "" : "s"}.`}
      </p>

      {next && (
        <section className="mt-8 rounded-lg border border-primary/25 bg-primary-soft p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Next appointment
            </h2>
            <StatusBadge status={next.status} />
          </div>

          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3.5">
              {nextProfessional && (
                <Image
                  src={nextProfessional.photo}
                  alt={nextProfessional.photoAlt}
                  width={96}
                  height={96}
                  className="h-12 w-12 rounded-md object-cover"
                />
              )}
              <div>
                <p className="font-semibold">{nextProfessional?.name}</p>
                <p className="text-sm text-primary">
                  {next.reason}
                  {nextProfessional && ` · ${nextProfessional.speciality}`}
                </p>
                {nextProfessional && (
                  <p className="text-sm text-muted-foreground">
                    {nextProfessional.clinic}, {nextProfessional.location}
                  </p>
                )}
              </div>
            </div>

            <div className="text-sm sm:text-right">
              <p>{next.longDate}</p>
              <p className="text-muted-foreground">
                {next.time} · {next.durationMinutes} minutes
              </p>
            </div>
          </div>

          <Link
            href={`/dashboard/appointments/${next.reference}`}
            className={`${buttonClasses("primary", "sm")} mt-5`}
          >
            View details
          </Link>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-serif text-xl font-semibold">What would you like to do?</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-lg border border-border bg-background p-5 shadow-soft hover:border-border-strong"
            >
              <h3 className="font-medium">{action.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{action.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Your account
        </h2>
        <dl className="mt-3 grid gap-4 rounded-lg border border-border bg-surface p-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium">Email</dt>
            <dd className="mt-0.5 text-sm text-muted-foreground">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium">Roles</dt>
            <dd className="mt-0.5 text-sm text-muted-foreground">
              {user.roles.join(", ") || "none"}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
