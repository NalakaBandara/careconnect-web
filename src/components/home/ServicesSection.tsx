import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import { fetchServices } from "@/lib/directory";
import type { Service } from "@/types";

export default async function ServicesSection() {
  const services = await fetchServices();

  return (
    <section id="services" className="border-b border-border py-20">
      <div className="container-page">
        <SectionHeading
          eyebrow="Services"
          title="Explore healthcare services"
          description="Every service listed on CareConnect is delivered by registered practitioners at partner clinics."
        />
        {/* gap-px plus a border-coloured background gives hairline dividers
            between cells without drawing 12 separate borders. */}
        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service: Service) => (
            <article key={service.id} className="bg-background p-6">
              <h3 className="font-serif text-xl font-semibold">{service.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {service.description ?? ""}
              </p>
              <Link
                href="/professionals"
                className="mt-5 inline-block text-sm font-medium text-primary hover:underline"
              >
                View professionals
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
