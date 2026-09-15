import Image from "next/image";
import Link from "next/link";
import { buttonClasses } from "@/components/Button";
import type { Professional } from "@/types";

export default function ProfessionalCard({ professional }: { professional: Professional }) {
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
          <p className="text-sm text-primary">{professional.speciality}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {professional.clinic}, {professional.location}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Main services
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {professional.services.map((service) => (
              <li
                key={service}
                className="rounded-md bg-surface px-2 py-1 text-xs text-secondary-foreground"
              >
                {service}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-muted-foreground">{professional.availabilitySummary}</p>
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
