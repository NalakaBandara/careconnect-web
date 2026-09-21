import Image from "next/image";
import Link from "next/link";
import { buttonClasses } from "@/components/Button";
import type { Professional } from "@/types";
import { clinicLine, experienceLine, primarySpeciality } from "@/lib/professional-format";

export default function ProfessionalCard({ professional }: { professional: Professional }) {
  const experience = experienceLine(professional);

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
          <p className="text-sm text-primary">{primarySpeciality(professional)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {clinicLine(professional)}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
        {professional.specialities.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Specialities
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {professional.specialities.map((speciality) => (
                <li
                  key={speciality}
                  className="rounded-md bg-surface px-2 py-1 text-xs text-secondary-foreground"
                >
                  {speciality}
                </li>
              ))}
            </ul>
          </div>
        )}
        {experience && <p className="text-muted-foreground">{experience}</p>}
      </div>

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
