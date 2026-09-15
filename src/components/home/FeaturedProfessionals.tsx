import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";
import ProfessionalCard from "@/components/ProfessionalCard";
import { professionals } from "@/data/professionals";

export default function FeaturedProfessionals() {
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
