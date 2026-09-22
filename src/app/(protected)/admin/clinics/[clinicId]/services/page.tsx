import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LinkToggle from "@/components/admin/LinkToggle";
import { fetchAdminClinics, fetchAdminServices, fetchClinicServices } from "@/lib/admin";
import { linkServiceAction } from "../../actions";

export const metadata: Metadata = { title: "Clinic services", robots: { index: false } };

export default async function ClinicServicesPage({
  params,
}: PageProps<"/admin/clinics/[clinicId]/services">) {
  const { clinicId } = await params;

  const [clinics, allServices, offered] = await Promise.all([
    fetchAdminClinics(),
    fetchAdminServices(),
    fetchClinicServices(clinicId),
  ]);

  const clinic = clinics.find((c) => c.id === clinicId);
  if (!clinic) notFound();

  const offeredIds = new Set(offered.map((s) => s.id));

  // A retired service should not be offered to anybody new, so it is only
  // listed here if this clinic already has it attached.
  const listed = allServices.filter((s) => s.status !== "INACTIVE" || offeredIds.has(s.id));

  return (
    <div>
      <Link href="/admin/clinics" className="text-sm text-muted-foreground hover:text-foreground">
        Back to clinics
      </Link>

      <h1 className="mt-6 font-serif text-2xl font-semibold sm:text-3xl">
        {clinic.name}: services
      </h1>
      <p className="mt-2 max-w-prose text-muted-foreground">
        Which services this clinic offers. Removing one here leaves the service itself alone,
        so other clinics keep offering it and this one can add it back later.
      </p>

      <ul className="mt-6 max-w-2xl divide-y divide-border rounded-lg border border-border">
        {listed.map((service) => {
          const attached = offeredIds.has(service.id);
          return (
            <LinkToggle
              key={service.id}
              label={service.name}
              hint={
                service.status === "INACTIVE"
                  ? `${service.durationMinutes} min · retired`
                  : `${service.durationMinutes} min`
              }
              attached={attached}
              action={linkServiceAction.bind(null, {
                clinicId,
                serviceId: service.id,
                attach: !attached,
              })}
              attachLabel="Offer here"
              detachLabel="Stop offering"
            />
          );
        })}
      </ul>

      {listed.length === 0 && (
        <p className="mt-6 rounded-lg border border-dashed border-border-strong bg-surface p-6 text-sm text-muted-foreground">
          No services exist yet.{" "}
          <Link href="/admin/services/new" className="font-medium text-primary hover:underline">
            Add one first.
          </Link>
        </p>
      )}
    </div>
  );
}
