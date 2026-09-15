import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { services } from "@/data/services";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Healthcare services",
  description:
    "Browse the healthcare services available through CareConnect, what each one typically includes, and the professionals who provide them.",
};

export default function ServicesPage() {
  return (
    <main id="main">
      <PageHero
        title="Explore healthcare services"
        intro="Each service is delivered by registered practitioners at partner clinics. Browse what a service covers, then view the professionals who provide it."
      />

      <section className="py-14">
        <div className="container-page grid gap-6 md:grid-cols-2">
          {services.map((service, index) => (
            <Reveal
              key={service.slug}
              // A small stagger reads as one movement rather than six.
              // Capped so the last card is not left waiting.
              delay={Math.min(index, 3) * 70}
              className="flex flex-col rounded-lg border border-border bg-background p-7 shadow-soft"
              as="article"
            >
              <h2 className="font-serif text-2xl font-semibold">{service.name}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{service.description}</p>

              <p className="mt-6 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Typically includes
              </p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {service.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              {/* mt-auto pins the link to the bottom, so cards of different
                  heights still line their links up. */}
              <Link
                href={`/professionals?speciality=${encodeURIComponent(service.speciality)}`}
                className="mt-auto pt-6 text-sm font-medium text-primary hover:underline"
              >
                View professionals
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
