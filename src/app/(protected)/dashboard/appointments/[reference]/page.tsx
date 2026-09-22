import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/appointments/StatusBadge";
import CancelAppointment from "@/components/appointments/CancelAppointment";
import { buttonClasses } from "@/components/Button";
import { fetchProfessional } from "@/lib/professionals";
import { canCancel, fetchAppointmentByReference } from "@/lib/appointments";
import { clinicLine, primarySpeciality } from "@/lib/professional-format";

export const metadata: Metadata = {
  title: "Appointment details",
  robots: { index: false },
};

export default async function AppointmentDetailPage({
  params,
  searchParams,
}: PageProps<"/dashboard/appointments/[reference]">) {
  const { reference } = await params;
  const { moved } = await searchParams;

  // Scoped to the signed-in user inside fetchAppointment, so another user's
  // reference gives a 404 rather than their appointment.
  const appointment = await fetchAppointmentByReference(reference);
  if (!appointment) notFound();

  const professional = await fetchProfessional(appointment.doctor.id);

  const facts: [string, string][] = [
    ["Date", appointment.longDate],
    ["Time", `${appointment.time} (${appointment.durationMinutes} minutes)`],
    ["Clinic", professional ? clinicLine(professional) : "—"],
    ["Reference", appointment.bookingReference],
  ];

  return (
    <div>
      <Link
        href="/dashboard/appointments"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        Back to my appointments
      </Link>

      {moved === "1" && (
        <p
          role="status"
          className="mt-6 rounded-md border border-primary/30 bg-primary-soft px-4 py-3 text-sm"
        >
          Your appointment has been moved. The clinic has been notified of the new time.
        </p>
      )}

      <div className="mt-6 grid gap-10 xl:grid-cols-[1.4fr_0.6fr] xl:gap-12">
        <div>
          <StatusBadge status={appointment.status} />
          <h1 className="mt-4 font-serif text-2xl font-semibold sm:text-3xl">
            {appointment.reason}
          </h1>

          {professional && (
            <div className="mt-6 flex items-center gap-3.5">
              <Image
                src={professional.photo}
                alt={professional.photoAlt}
                width={128}
                height={128}
                className="h-16 w-16 rounded-md object-cover"
              />
              <div>
                <p className="font-semibold">{professional.name}</p>
                <p className="text-sm text-primary">{primarySpeciality(professional)}</p>
              </div>
            </div>
          )}

          <dl className="mt-8 border-t border-border">
            {facts.map(([label, value]) => (
              <div
                key={label}
                className="flex flex-col gap-0.5 border-b border-border py-3.5 sm:flex-row sm:gap-4"
              >
                <dt className="text-sm font-medium sm:w-32 sm:shrink-0">{label}</dt>
                <dd className="text-sm text-muted-foreground">{value}</dd>
              </div>
            ))}
          </dl>

          {appointment.notes && (
            <div className="mt-8">
              <h2 className="text-sm font-medium">Notes you gave the clinic</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {appointment.notes}
              </p>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-lg border border-border bg-background p-6 shadow-soft">
          <h2 className="font-serif text-lg font-semibold">Manage this appointment</h2>

          {canCancel(appointment) ? (
            <div className="mt-4 flex flex-col gap-2.5">
              <Link
                href={`/book/${appointment.doctor.id}?reschedule=${appointment.bookingReference}`}
                className={buttonClasses("outline", "md")}
              >
                Reschedule
              </Link>
              <CancelAppointment
                reference={appointment.bookingReference}
                professionalName={professional?.name ?? "this professional"}
              />
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Please give the clinic as much notice as you can, so the slot can go to somebody
                else.
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {appointment.status === "CANCELLED"
                ? "This appointment was cancelled. Book again to arrange a new one."
                : "This appointment has already taken place, so there is nothing left to change."}
            </p>
          )}

          <Link
            href={`/professionals/${appointment.doctor.id}`}
            className="mt-5 inline-block text-sm font-medium text-primary hover:underline"
          >
            View full profile
          </Link>
        </aside>
      </div>
    </div>
  );
}
