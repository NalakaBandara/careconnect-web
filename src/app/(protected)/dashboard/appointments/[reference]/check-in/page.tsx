import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import CheckInQr from "@/components/appointments/CheckInQr";
import { fetchAppointmentByReference } from "@/lib/appointments";
import { requireUser } from "@/lib/guards";

export const metadata: Metadata = {
  title: "Check in",
  robots: { index: false },
};

// The screen a patient holds up at reception: the code as large as the phone
// allows, and just enough detail for the receptionist to match it at a glance.
export default async function CheckInPage({
  params,
}: PageProps<"/dashboard/appointments/[reference]/check-in">) {
  await requireUser();
  const { reference } = await params;

  // Looked up inside the signed-in user's own appointments, so somebody else's
  // reference is not found rather than shown.
  const appointment = await fetchAppointmentByReference(reference);
  if (!appointment || appointment.status !== "CONFIRMED" || appointment.isPast) notFound();

  return (
    <div className="mx-auto max-w-md text-center">
      <Link
        href={`/dashboard/appointments/${appointment.bookingReference}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        Back to appointment
      </Link>

      <h1 className="mt-6 font-serif text-2xl font-semibold sm:text-3xl">Check in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Show this code at reception when you arrive.
      </p>

      <div className="mt-6 flex justify-center rounded-lg border border-border bg-white p-4 text-black">
        <CheckInQr reference={appointment.bookingReference} size={280} />
      </div>

      <p className="mt-4 text-2xl font-semibold tracking-[0.2em]">
        {appointment.bookingReference}
      </p>

      <dl className="mt-6 space-y-1 text-sm">
        <div>
          <dt className="sr-only">Doctor</dt>
          <dd className="font-medium">{appointment.doctorName}</dd>
        </div>
        <div>
          <dt className="sr-only">When</dt>
          <dd className="text-muted-foreground">
            {appointment.longDate} at {appointment.time}
          </dd>
        </div>
        {appointment.clinic?.name && (
          <div>
            <dt className="sr-only">Clinic</dt>
            <dd className="text-muted-foreground">{appointment.clinic.name}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
