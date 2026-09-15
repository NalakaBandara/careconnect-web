import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import ProfessionalCard from "@/components/ProfessionalCard";
import { fetchProfessionals } from "@/lib/professionals";

export default async function FeaturedProfessionals() {
  // Only the first four, so adding a fifth professional does not stretch the
  // home page.
  const professionals = (await fetchProfessionals()).slice(0, 4);

  return (
    <section className="border-b border-border py-20">
      <div className="container-page">
        <SectionHeading
          eyebrow="Directory"
          title="Healthcare professionals you can trust"
          description="A small selection of practitioners currently listed on CareConnect. Public profiles show services, clinic details and general availability."
          action={
            <Link href="/professionals" className="text-sm font-medium text-primary hover:underline">
              View all professionals
            </Link>
          }
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {professionals.map((professional) => (
            <ProfessionalCard key={professional.id} professional={professional} />
          ))}
        </div>
      </div>
    </section>
  );
}
