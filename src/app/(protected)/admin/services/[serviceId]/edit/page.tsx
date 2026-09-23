import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ServiceForm from "@/components/admin/ServiceForm";
import { fetchAdminServices } from "@/lib/admin";
import { updateServiceAction } from "../../actions";
import { requireAdmin } from "@/lib/guards";

export const metadata: Metadata = { title: "Edit service", robots: { index: false } };

export default async function EditServicePage({
  params,
}: PageProps<"/admin/services/[serviceId]/edit">) {
  // Checked here as well as in the layout. The Next docs are explicit that a
  // layout is not an authorisation boundary: it is not guaranteed to re-run for
  // every navigation into the routes beneath it.
  await requireAdmin();
  const { serviceId } = await params;

  // The API has no single-service endpoint, so the one being edited is picked
  // out of the list.
  const service = (await fetchAdminServices()).find((s) => s.id === serviceId);
  if (!service) notFound();

  return (
    <div>
      <Link href="/admin/services" className="text-sm text-muted-foreground hover:text-foreground">
        Back to services
      </Link>

      <h1 className="mt-6 font-serif text-2xl font-semibold sm:text-3xl">Edit {service.name}</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">
        Changing the length affects new bookings only. Appointments already made keep the
        length they were booked at.
      </p>

      <div className="mt-8">
        <ServiceForm
          // bind() fixes which service is being edited on the server, so the
          // browser cannot repoint the form at a different one.
          action={updateServiceAction.bind(null, service.id)}
          service={service}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
