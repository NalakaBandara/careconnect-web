import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ClinicForm from "@/components/admin/ClinicForm";
import { fetchAdminClinics } from "@/lib/admin";
import { updateClinicAction } from "../../actions";

export const metadata: Metadata = { title: "Edit clinic", robots: { index: false } };

export default async function EditClinicPage({
  params,
}: PageProps<"/admin/clinics/[clinicId]/edit">) {
  const { clinicId } = await params;

  // The API has no single-clinic endpoint, so the one being edited is picked
  // out of the list.
  const clinic = (await fetchAdminClinics()).find((c) => c.id === clinicId);
  if (!clinic) notFound();

  return (
    <div>
      <Link href="/admin/clinics" className="text-sm text-muted-foreground hover:text-foreground">
        Back to clinics
      </Link>

      <h1 className="mt-6 font-serif text-2xl font-semibold sm:text-3xl">Edit {clinic.name}</h1>

      <div className="mt-8">
        <ClinicForm
          // bind() fixes which clinic is being edited on the server, so the
          // browser cannot repoint the form at a different one.
          action={updateClinicAction.bind(null, clinic.id)}
          clinic={clinic}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
