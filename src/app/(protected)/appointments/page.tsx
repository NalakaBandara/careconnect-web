import type { Metadata } from "next";
import Link from "next/link";
import AppointmentCard from "@/components/appointments/AppointmentCard";
import { buttonClasses } from "@/components/Button";
import { fetchAppointments, splitAppointments } from "@/lib/appointments";

export const metadata: Metadata = {
  title: "My appointments",
  robots: { index: false },
};

export default async function AppointmentsPage({
  searchParams,
}: PageProps<"/appointments">) {
  const { tab } = await searchParams;
  const showPast = tab === "past";

  const all = await fetchAppointments();
  const { upcoming, past } = splitAppointments(all);
  const shown = showPast ? past : upcoming;

  return (
    <main>
      <div className="border-b border-border bg-surface py-10">
        <div className="container-page">
          <h1 className="font-serif text-3xl font-semibold sm:text-4xl">My appointments</h1>
          <p className="mt-3 text-muted-foreground">
            View, reschedule or cancel your bookings.
          </p>

          {/* The tabs are links, not state. So the back button works, and a
              filtered view can be bookmarked or shared. */}
          <nav aria-label="Appointment filter" className="mt-6 inline-flex rounded-md bg-background p-1">
            <Link
              href="/appointments"
              aria-current={!showPast ? "page" : undefined}
              className={
                "rounded px-4 py-1.5 text-sm " +
                (!showPast ? "bg-surface font-medium" : "text-muted-foreground hover:text-foreground")
              }
            >
              Upcoming ({upcoming.length})
            </Link>
            <Link
              href="/appointments?tab=past"
              aria-current={showPast ? "page" : undefined}
              className={
                "rounded px-4 py-1.5 text-sm " +
                (showPast ? "bg-surface font-medium" : "text-muted-foreground hover:text-foreground")
              }
            >
              Past ({past.length})
            </Link>
          </nav>
        </div>
      </div>

      <section className="py-12">
        <div className="container-page">
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {showPast ? "Past appointments" : "Upcoming"}
          </h2>

          {shown.length > 0 ? (
            <div className="mt-5 space-y-4">
              {shown.map((appointment) => (
                <AppointmentCard key={appointment.reference} appointment={appointment} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-border-strong bg-surface p-8 text-center">
              <h3 className="font-serif text-lg font-semibold">
                {showPast ? "No past appointments" : "No upcoming appointments"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                {showPast
                  ? "Appointments you have attended or cancelled will appear here."
                  : "Find a professional and request an appointment to see it listed here."}
              </p>
              {!showPast && (
                <Link
                  href="/professionals"
                  className={`${buttonClasses("primary", "md")} mt-5`}
                >
                  Find a professional
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
