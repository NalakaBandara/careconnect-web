import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/Button";
import { fetchAdminClinics, fetchAllAppointments, fetchUsers } from "@/lib/admin";
import { fetchProfessionals, fetchServices } from "@/lib/directory";
import { todayIso } from "@/lib/date-format";
import { requireAdmin } from "@/lib/guards";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false },
};

export default async function AdminPage() {
  // Safe to assert: admin/layout.tsx has already turned away anyone without
  // the admin role.
  const user = await requireAdmin();

  // Five independent reads, so they run together rather than in sequence.
  const [doctors, clinics, services, appointments, users] = await Promise.all([
    fetchProfessionals(),
    fetchAdminClinics(),
    fetchServices(),
    fetchAllAppointments(),
    fetchUsers(),
  ]);

  const today = todayIso();
  const pending = appointments.filter((a) => a.status === "PENDING");
  const upcoming = appointments.filter(
    (a) => a.appointmentDate >= today && (a.status === "PENDING" || a.status === "CONFIRMED"),
  );

  // A doctor with no clinic cannot be booked at all, which is the kind of
  // thing worth surfacing rather than leaving someone to discover.
  const unbookable = doctors.filter((d) => d.clinics.length === 0);

  const stats = [
    { label: "Doctors", value: doctors.length, href: "/admin/doctors" as const },
    { label: "Clinics", value: clinics.length, href: "/admin/clinics" as const },
    { label: "Upcoming appointments", value: upcoming.length, href: "/admin/appointments" as const },
    { label: "Registered users", value: users.length, href: null },
    { label: "Services", value: services.length, href: null },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold sm:text-3xl">Administration</h1>
      <p className="mt-2 text-muted-foreground">
        Signed in as {user.email}. Only accounts holding the <strong>admin</strong> role can see
        this area.
      </p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const body = (
            <>
              <dt className="text-sm text-muted-foreground">{stat.label}</dt>
              <dd className="mt-1 text-3xl font-semibold">{stat.value}</dd>
            </>
          );

          return stat.href ? (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-lg border border-border bg-background p-5 shadow-soft hover:border-border-strong"
            >
              {body}
            </Link>
          ) : (
            <div
              key={stat.label}
              className="rounded-lg border border-border bg-background p-5 shadow-soft"
            >
              {body}
            </div>
          );
        })}
      </dl>

      {(pending.length > 0 || unbookable.length > 0) && (
        <section className="mt-10">
          <h2 className="font-serif text-xl font-semibold">Needs attention</h2>
          <ul className="mt-4 space-y-3">
            {pending.length > 0 && (
              <li className="rounded-lg border border-border bg-surface p-4 text-sm">
                <strong>
                  {pending.length} {pending.length === 1 ? "request" : "requests"} awaiting
                  confirmation
                </strong>
                <span className="block text-muted-foreground">
                  Patients see these as &ldquo;Awaiting clinic&rdquo; until they are confirmed.
                </span>
                <Link
                  href="/admin/appointments"
                  className="mt-2 inline-block font-medium text-primary hover:underline"
                >
                  Review them
                </Link>
              </li>
            )}

            {unbookable.length > 0 && (
              <li className="rounded-lg border border-border bg-surface p-4 text-sm">
                <strong>
                  {unbookable.length} {unbookable.length === 1 ? "doctor is" : "doctors are"} not
                  attached to a clinic
                </strong>
                <span className="block text-muted-foreground">
                  They appear in the directory but cannot be booked, because an appointment is
                  always made at a clinic: {unbookable.map((d) => d.name).join(", ")}.
                </span>
                <Link
                  href="/admin/doctors"
                  className="mt-2 inline-block font-medium text-primary hover:underline"
                >
                  Manage doctors
                </Link>
              </li>
            )}
          </ul>
        </section>
      )}

      <div className="mt-10 flex flex-wrap gap-2.5">
        <Link href="/admin/appointments" className={buttonClasses("primary", "md")}>
          Appointments
        </Link>
        <Link href="/admin/doctors" className={buttonClasses("outline", "md")}>
          Doctors
        </Link>
        <Link href="/admin/clinics" className={buttonClasses("outline", "md")}>
          Clinics
        </Link>
        <Link href="/dashboard" className={buttonClasses("ghost", "md")}>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
