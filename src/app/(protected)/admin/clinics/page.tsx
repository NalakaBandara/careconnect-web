import type { Metadata } from "next";
import Link from "next/link";
import DeleteClinic from "@/components/admin/DeleteClinic";
import { buttonClasses } from "@/components/Button";
import { fetchAdminClinics } from "@/lib/admin";

export const metadata: Metadata = { title: "Clinics", robots: { index: false } };

const NOTICES: Record<string, string> = {
  added: "The clinic has been added.",
  saved: "Your changes have been saved.",
  removed: "The clinic has been deleted.",
};

export default async function AdminClinicsPage({ searchParams }: PageProps<"/admin/clinics">) {
  const params = await searchParams;
  const clinics = await fetchAdminClinics();

  // Which notice to show is decided by the URL, so refreshing shows the
  // message again rather than replaying the action.
  const notice = Object.keys(NOTICES).find((key) => params[key] === "1");

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold sm:text-3xl">Clinics</h1>
          <p className="mt-2 text-muted-foreground">
            {clinics.length} {clinics.length === 1 ? "clinic" : "clinics"} in the directory.
          </p>
        </div>
        <Link href="/admin/clinics/new" className={buttonClasses("primary", "md")}>
          Add clinic
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

      {clinics.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border-strong bg-surface p-8 text-center">
          <h2 className="font-serif text-lg font-semibold">No clinics yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Doctors are attached to clinics, and appointments are booked at one, so add a
            clinic before anything else.
          </p>
        </div>
      ) : (
        // A table, because this is tabular data, which also means a screen
        // reader announces the column each cell belongs to.
        <div className="mt-8 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Name
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Address
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Contact
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clinics.map((clinic) => (
                <tr key={clinic.id} className="bg-background">
                  <th scope="row" className="px-4 py-3 font-normal">
                    <span className="font-medium">{clinic.name}</span>
                    <span className="block text-xs text-muted-foreground">id {clinic.id}</span>
                  </th>
                  <td className="px-4 py-3 text-muted-foreground">
                    {clinic.addressLine1 ?? "—"}
                    <span className="block text-xs">{clinic.city ?? ""}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{clinic.telephone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/clinics/${clinic.id}/edit`}
                        className={buttonClasses("outline", "sm")}
                      >
                        Edit
                      </Link>
                      <DeleteClinic id={clinic.id} name={clinic.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
