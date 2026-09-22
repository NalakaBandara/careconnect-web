import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/Button";
import { fetchProfessionals } from "@/lib/directory";

export const metadata: Metadata = { title: "Doctors", robots: { index: false } };

const NOTICES: Record<string, string> = {
  added: "The doctor has been added to the directory.",
  saved: "Your changes have been saved.",
};

export default async function AdminDoctorsPage({ searchParams }: PageProps<"/admin/doctors">) {
  const params = await searchParams;
  const doctors = await fetchProfessionals();
  const notice = Object.keys(NOTICES).find((key) => params[key] === "1");

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold sm:text-3xl">Doctors</h1>
          <p className="mt-2 text-muted-foreground">
            {doctors.length} listed in the public directory.
          </p>
        </div>
        <Link href="/admin/doctors/new" className={buttonClasses("primary", "md")}>
          Add doctor
        </Link>
      </div>

      {notice && (
        <p
          role="status"
          className="mt-6 rounded-md border border-primary/30 bg-primary-soft px-4 py-3 text-sm"
        >
          {NOTICES[notice]}
        </p>
      )}

      {doctors.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border-strong bg-surface p-8 text-center">
          <h2 className="font-serif text-lg font-semibold">No doctors yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            A doctor is a registered user who has been promoted, so somebody has to have an
            account before they can be added here.
          </p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Name</th>
                <th scope="col" className="px-4 py-3 font-medium">Specialities</th>
                <th scope="col" className="px-4 py-3 font-medium">Clinics</th>
                <th scope="col" className="px-4 py-3 font-medium">Licence</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {doctors.map((doctor) => (
                <tr key={doctor.id} className="bg-background">
                  <th scope="row" className="px-4 py-3 font-normal">
                    <span className="font-medium">{doctor.name}</span>
                    <span className="block text-xs text-muted-foreground">id {doctor.id}</span>
                  </th>
                  <td className="px-4 py-3 text-muted-foreground">
                    {doctor.specialities.join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {doctor.clinics.map((c) => c.name).join(", ") || "none"}
                  </td>
                  <td className="px-4 py-3">
                    {doctor.isVerified ? (
                      <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
                        Verified
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not verified</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/doctors/${doctor.id}/schedules`}
                        className={buttonClasses("ghost", "sm")}
                      >
                        Schedule
                      </Link>
                      <Link
                        href={`/admin/doctors/${doctor.id}/edit`}
                        className={buttonClasses("outline", "sm")}
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* There is no delete for a doctor, and that is the right call: an
          appointment already booked with them must keep its record. Removing
          every clinic is the supported way to take somebody out of use. */}
      <p className="mt-4 text-sm text-muted-foreground">
        Doctors are not deleted, because appointments already booked with them would lose
        their record. To take somebody out of the directory, open Edit and remove their
        clinics: an appointment is always made at a clinic, so a doctor with none cannot be
        booked.
      </p>
    </div>
  );
}
