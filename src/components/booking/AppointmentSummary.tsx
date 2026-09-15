import Image from "next/image";
import type { Professional } from "@/types";

export default function AppointmentSummary({
  professional,
  longDate,
  time,
  durationMinutes,
  title,
}: {
  professional: Professional;
  longDate: string;
  time: string;
  durationMinutes: number;
  title?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-6 shadow-soft">
      {title && (
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {title}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <Image
          src={professional.photo}
          alt={professional.photoAlt}
          width={96}
          height={96}
          className="h-12 w-12 rounded-md object-cover"
        />
        <div>
          <p className="font-semibold">{professional.name}</p>
          <p className="text-sm text-primary">{professional.speciality}</p>
        </div>
      </div>

      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex gap-2">
          <dt className="sr-only">Date</dt>
          <dd>{longDate}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="sr-only">Time</dt>
          <dd>
            {time} · {durationMinutes} minutes
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="sr-only">Clinic</dt>
          <dd className="text-muted-foreground">
            {professional.clinic}, {professional.location}
          </dd>
        </div>
      </dl>
    </div>
  );
}
