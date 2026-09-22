import Image from "next/image";
import type { Professional } from "@/types";
import { clinicLine, primarySpeciality } from "@/lib/professional-format";

export default function AppointmentSummary({
  professional,
  longDate,
  time,
  durationMinutes,
  title,
  clinicName,
  serviceName,
}: {
  professional: Professional;
  longDate: string;
  time: string;
  durationMinutes: number;
  title?: string;
  clinicName?: string;
  serviceName?: string;
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
          <p className="text-sm text-primary">
            {serviceName ?? primarySpeciality(professional)}
          </p>
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
            {clinicName ?? clinicLine(professional)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
