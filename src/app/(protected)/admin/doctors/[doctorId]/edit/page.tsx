import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditDoctorForm from "@/components/admin/EditDoctorForm";
import { fetchProfessional } from "@/lib/directory";
import { updateDoctorAction } from "../../actions";

export const metadata: Metadata = { title: "Edit doctor", robots: { index: false } };

export default async function EditDoctorPage({ params }: PageProps<"/admin/doctors/[doctorId]/edit">) {
  const { doctorId } = await params;
  const doctor = await fetchProfessional(doctorId);
  if (!doctor) notFound();

  return (
    <div>
      <Link href="/admin/doctors" className="text-sm text-muted-foreground hover:text-foreground">
        Back to doctors
      </Link>

      <h1 className="mt-6 font-serif text-2xl font-semibold sm:text-3xl">Edit {doctor.name}</h1>
      <p className="mt-2 text-muted-foreground">
        The API allows the summary, experience and licence verification to be changed here.
        Specialities and clinics are set when the doctor is added.
      </p>

      <div className="mt-8">
        <EditDoctorForm
          // bind() fixes which doctor is being edited on the server, so the
          // browser cannot repoint the form at a different one.
          action={updateDoctorAction.bind(null, doctor.id)}
          doctor={doctor}
        />
      </div>
    </div>
  );
}
