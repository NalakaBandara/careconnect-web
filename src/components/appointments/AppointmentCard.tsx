import Image from "next/image";
import Link from "next/link";
import StatusBadge from "@/components/appointments/StatusBadge";
import { buttonClasses } from "@/components/Button";
import { fetchProfessional } from "@/lib/professionals";
import { canCancel, type DecoratedAppointment } from "@/lib/appointments";
import CancelAppointment from "@/components/appointments/CancelAppointment";
import { clinicLine, primarySpeciality } from "@/lib/professional-format";

export default async function AppointmentCard({
  appointment,
}: {
  appointment: DecoratedAppointment;
}) {
  const professional = await fetchProfessional(appointment.doctor.id);

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-background shadow-soft">
      <div className="border-b border-border bg-surface/60 px-5 py-2.5">
        <StatusBadge status={appointment.status} />
      </div>

      <div className="p-5">
        <div className="flex items-center gap-3.5">
          {professional && (
            <Image
              src={professional.photo}
              alt={professional.photoAlt}
              width={96}
              height={96}
              className="h-12 w-12 shrink-0 rounded-md object-cover"
            />
          )}
          <div>
            <h3 className="font-semibold">{professional?.name ?? "Professional"}</h3>
            <p className="text-sm text-primary">
              {appointment.reason}
              {professional && ` · ${primarySpeciality(professional)}`}
            </p>
            {professional && (
              <p className="text-sm text-muted-foreground">
                {clinicLine(professional)}
              </p>
            )}
          </div>
        </div>

        <dl className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
          <div className="flex gap-2">
            <dt className="sr-only">Date</dt>
            <dd>{appointment.longDate}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="sr-only">Time</dt>
            <dd>
              {appointment.time} · {appointment.durationMinutes} minutes
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="sr-only">Reference</dt>
            <dd className="text-muted-foreground">Reference {appointment.bookingReference}</dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <Link
            href={`/dashboard/appointments/${appointment.bookingReference}`}
            className={buttonClasses("outline", "sm")}
          >
            View details
          </Link>

          {canCancel(appointment) && (
            <>
              {/* Reschedule reuses the booking route rather than duplicating
                  the slot picker. The reference tells it to move an existing
                  appointment instead of creating a new one. */}
              <Link
                href={`/book/${appointment.doctor.id}?reschedule=${appointment.bookingReference}`}
                className={buttonClasses("outline", "sm")}
              >
                Reschedule
              </Link>
              <CancelAppointment
                reference={appointment.bookingReference}
                professionalName={professional?.name ?? "this professional"}
              />
            </>
          )}
        </div>
      </div>
    </article>
  );
}
