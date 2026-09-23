import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditDoctorForm from "@/components/admin/EditDoctorForm";
import LinkToggle from "@/components/admin/LinkToggle";
import { fetchAdminClinics, fetchAdminSpecialities } from "@/lib/admin";
import { fetchProfessional } from "@/lib/directory";
import { linkClinicAction, linkSpecialityAction, updateDoctorAction } from "../../actions";
import { requireAdmin } from "@/lib/guards";

export const metadata: Metadata = { title: "Edit doctor", robots: { index: false } };

export default async function EditDoctorPage({
  params,
}: PageProps<"/admin/doctors/[doctorId]/edit">) {
  // Checked here as well as in the layout. The Next docs are explicit that a
  // layout is not an authorisation boundary: it is not guaranteed to re-run for
  // every navigation into the routes beneath it.
  await requireAdmin();
  const { doctorId } = await params;

  const [doctor, clinics, specialities] = await Promise.all([
    fetchProfessional(doctorId),
    fetchAdminClinics(),
    fetchAdminSpecialities(),
  ]);
  if (!doctor) notFound();

  const attachedClinicIds = new Set(doctor.clinics.map((c) => c.id));
  const attachedSpecialityNames = new Set(doctor.specialities);

  return (
    <div>
      <Link href="/admin/doctors" className="text-sm text-muted-foreground hover:text-foreground">
        Back to doctors
      </Link>

      <h1 className="mt-6 font-serif text-2xl font-semibold sm:text-3xl">Edit {doctor.name}</h1>

      <section className="mt-8">
        <h2 className="font-serif text-xl font-semibold">Profile</h2>
        <div className="mt-4">
          <EditDoctorForm
            // bind() fixes which doctor is being edited on the server, so the
            // browser cannot repoint the form at a different one.
            action={updateDoctorAction.bind(null, doctor.id)}
            doctor={doctor}
          />
        </div>
      </section>

      <section className="mt-12 max-w-2xl">
        <h2 className="font-serif text-xl font-semibold">Clinics</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Appointments are always made at a clinic. A doctor with none disappears from the
          public directory entirely, which is how somebody is taken out of use without
          destroying the appointments already booked with them.
          Their last clinic cannot be removed here, because the API would then stop
          returning them at all and this page could no longer be opened.
        </p>

        {doctor.clinics.length === 0 && (
          <p
            role="status"
            className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {doctor.name} is not attached to any clinic and cannot currently be booked.
          </p>
        )}

        <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
          {clinics.map((clinic) => {
            const attached = attachedClinicIds.has(clinic.id);
            return (
              <LinkToggle
                key={clinic.id}
                label={clinic.name}
                hint={clinic.city ?? undefined}
                attached={attached}
                action={linkClinicAction.bind(null, {
                  doctorId: doctor.id,
                  clinicId: clinic.id,
                  attach: !attached,
                })}
              />
            );
          })}
        </ul>
      </section>

      <section className="mt-12 max-w-2xl">
        <h2 className="font-serif text-xl font-semibold">Specialities</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Shown on the public profile, and used by the speciality filter in the directory.
        </p>

        <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
          {specialities.map((speciality) => {
            // The public doctor payload carries speciality names rather than
            // ids, so the match is by name. Ids are what the API wants back.
            const attached = attachedSpecialityNames.has(speciality.name);
            return (
              <LinkToggle
                key={speciality.id}
                label={speciality.name}
                attached={attached}
                action={linkSpecialityAction.bind(null, {
                  doctorId: doctor.id,
                  specialtyId: speciality.id,
                  attach: !attached,
                })}
              />
            );
          })}
        </ul>
      </section>
    </div>
  );
}
