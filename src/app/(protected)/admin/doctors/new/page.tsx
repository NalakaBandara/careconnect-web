import type { Metadata } from "next";
import Link from "next/link";
import PromoteDoctorForm from "@/components/admin/PromoteDoctorForm";
import { fetchAdminClinics, fetchAdminSpecialities, fetchUsers } from "@/lib/admin";
import { fetchProfessionals } from "@/lib/directory";
import { promoteDoctorAction } from "../actions";

export const metadata: Metadata = { title: "Add a doctor", robots: { index: false } };

export default async function NewDoctorPage() {
  // Four independent reads, so they run together rather than in sequence.
  const [users, clinics, specialities, doctors] = await Promise.all([
    fetchUsers(),
    fetchAdminClinics(),
    fetchAdminSpecialities(),
    fetchProfessionals(),
  ]);

  // Somebody who is already a doctor should not be offered for promotion
  // again. Matching on name because the public doctor payload no longer
  // carries the user id, which is right: that field was removed on purpose.
  const alreadyDoctors = new Set(doctors.map((d) => d.name.toLowerCase()));
  const candidates = users.filter(
    (u) =>
      !u.roles.includes("DOCTOR") &&
      !alreadyDoctors.has(`${u.firstName} ${u.lastName}`.toLowerCase()),
  );

  return (
    <div>
      <Link href="/admin/doctors" className="text-sm text-muted-foreground hover:text-foreground">
        Back to doctors
      </Link>

      <h1 className="mt-6 font-serif text-2xl font-semibold sm:text-3xl">Add a doctor</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">
        A doctor is a registered user who has been given the doctor role. Choose the person,
        add their licence and the clinics they work at, and they appear in the public
        directory.
      </p>

      <div className="mt-8">
        <PromoteDoctorForm
          action={promoteDoctorAction}
          users={candidates}
          clinics={clinics}
          specialities={specialities}
        />
      </div>
    </div>
  );
}
