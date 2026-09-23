import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchProfessional } from "@/lib/directory";
import { fetchAppointmentByReference } from "@/lib/appointments";
import AppointmentSummary from "@/components/booking/AppointmentSummary";
import BookingSteps from "@/components/booking/BookingSteps";
import { buttonClasses } from "@/components/Button";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Appointment confirmed",
  robots: { index: false },
};

export default async function ConfirmedPage({
  params,
  searchParams,
}: PageProps<"/book/[professionalId]/confirmed">) {
  const { professionalId } = await params;
  const { ref } = await searchParams;

  const reference = typeof ref === "string" ? ref : "";

  // All three at once. None depends on the others, so awaiting them one after
  // another only made this page wait for the sum of three round trips.
  //
  // The appointment is looked up inside this user's own appointments, so
  // somebody else's reference simply is not found rather than showing their
  // booking.
  const [professional, user, appointment] = await Promise.all([
    fetchProfessional(professionalId),
    getSession(),
    fetchAppointmentByReference(reference),
  ]);

  if (!professional) notFound();
  if (!appointment) notFound();



  return (
    <main id="main">
      <div className="border-b border-border bg-surface py-10">
        <div className="container-page">
          <BookingSteps current={3} />
        </div>
      </div>

      <div className="container-page py-14">
        <div className="mx-auto max-w-xl text-center">
          <div
            aria-hidden="true"
            className="mx-auto flex h-18 w-18 items-center justify-center rounded-full bg-primary-soft"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-9 w-9 text-primary"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="m9 11 3 3L22 4" />
            </svg>
          </div>

          <h1 className="mt-6 font-serif text-3xl font-semibold sm:text-4xl">
            Appointment confirmed
          </h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            We have emailed the details to {user?.email}. The clinic will contact you if anything
            changes.
          </p>

          <div className="mt-8 rounded-lg border border-border bg-surface px-6 py-4">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Booking reference
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-[0.25em]">
              {appointment.bookingReference}
            </p>
          </div>

          <div className="mt-5 text-left">
            <AppointmentSummary
              professional={professional}
              longDate={appointment.longDate}
              time={appointment.time}
              durationMinutes={appointment.durationMinutes}
            />
          </div>

          <div className="mt-8 flex flex-col justify-center gap-2.5 sm:flex-row">
            <Link href="/dashboard" className={buttonClasses("primary", "md")}>
              Go to my dashboard
            </Link>
            <Link href="/professionals" className={buttonClasses("outline", "md")}>
              Find more care
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
