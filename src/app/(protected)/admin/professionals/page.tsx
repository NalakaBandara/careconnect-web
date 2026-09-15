import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import DeleteProfessional from "@/components/admin/DeleteProfessional";
import { buttonClasses } from "@/components/Button";
import { fetchProfessionals } from "@/lib/professionals";

export const metadata: Metadata = {
  title: "Manage professionals",
  robots: { index: false },
};

const NOTICES: Record<string, string> = {
  added: "The professional has been added to the directory.",
  saved: "Your changes have been saved.",
  removed: "The professional has been removed from the directory.",
};

export default async function AdminProfessionalsPage({
  searchParams,
}: PageProps<"/admin/professionals">) {
  const params = await searchParams;
  const professionals = await fetchProfessionals();

  // Which notice to show is decided by the URL, so a refresh does not replay
  // an action - it just shows the message again.
  const notice = Object.keys(NOTICES).find((key) => params[key] === "1");

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold sm:text-3xl">Professionals</h1>
          <p className="mt-2 text-muted-foreground">
            {professionals.length} listed in the public directory.
          </p>
        </div>
        <Link href="/admin/professionals/new" className={buttonClasses("primary", "md")}>
          Add professional
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

      {professionals.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border-strong bg-surface p-8 text-center">
          <h2 className="font-serif text-lg font-semibold">The directory is empty</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Add a professional and they will appear on the public site straight away.
          </p>
        </div>
      ) : (
        // A table, because this is tabular data - which also means a screen
        // reader announces the column a cell belongs to.
        <div className="mt-8 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Name
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Speciality
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Clinic
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Services
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {professionals.map((professional) => (
                <tr key={professional.id} className="bg-background">
                  <th scope="row" className="px-4 py-3 font-normal">
                    <div className="flex items-center gap-3">
                      <Image
                        src={professional.photo}
                        alt=""
                        width={64}
                        height={64}
                        className="h-9 w-9 shrink-0 rounded-md object-cover"
                      />
                      <div>
                        <span className="font-medium">{professional.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {professional.id}
                        </span>
                      </div>
                    </div>
                  </th>
                  <td className="px-4 py-3">{professional.speciality}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {professional.clinic}
                    <span className="block text-xs">{professional.location}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {professional.services.length}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/professionals/${professional.id}`}
                        className={buttonClasses("ghost", "sm")}
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/professionals/${professional.id}/edit`}
                        className={buttonClasses("outline", "sm")}
                      >
                        Edit
                      </Link>
                      <DeleteProfessional id={professional.id} name={professional.name} />
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
