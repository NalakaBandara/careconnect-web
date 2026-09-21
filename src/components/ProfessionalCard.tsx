import Image from "next/image";
import Link from "next/link";
import { buttonClasses } from "@/components/Button";
import type { Professional } from "@/types";
import { clinicLine, experienceLine, specialityLine } from "@/lib/professional-format";

export default function ProfessionalCard({ professional }: { professional: Professional }) {
  const experience = experienceLine(professional);
  const specialities = specialityLine(professional);

  return (
    <article className="flex h-full flex-col rounded-lg border border-border bg-background p-5 shadow-soft">
      <div className="flex items-start gap-4">
        <Image
          src={professional.photo}
          alt={professional.photoAlt}
          width={64}
          height={64}
          // width and height reserve the space before the file loads, so the
          // page does not jump around as images arrive.
          className="h-16 w-16 rounded-md object-cover"
        />
        <div className="min-w-0">
          <h3 className="font-serif text-lg font-semibold leading-snug">{professional.name}</h3>
          {specialities && <p className="text-sm text-primary">{specialities}</p>}
          <p className="mt-1 text-sm text-muted-foreground">
            {clinicLine(professional)}
          </p>
        </div>
      </div>

      {(experience || professional.isVerified) && (
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border pt-4 text-sm">
          {experience && <p className="text-muted-foreground">{experience}</p>}
          {professional.isVerified && (
            <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
              Licence verified
            </span>
          )}
        </div>
      )}

      <div className="mt-5 pt-1">
        <Link
          href={`/professionals/${professional.id}`}
          className={buttonClasses("outline", "md")}
        >
          View profile
        </Link>
      </div>
    </article>
  );
}
