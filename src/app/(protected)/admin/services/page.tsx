import type { Metadata } from "next";
import Link from "next/link";
import RetireService from "@/components/admin/RetireService";
import { buttonClasses } from "@/components/Button";
import { fetchAdminServices } from "@/lib/admin";
import { requireAdmin } from "@/lib/guards";

export const metadata: Metadata = { title: "Services", robots: { index: false } };

const NOTICES: Record<string, string> = {
  added: "The service has been added.",
  saved: "Your changes have been saved.",
  retired: "The service has been retired and is no longer offered.",
};

export default async function AdminServicesPage({ searchParams }: PageProps<"/admin/services">) {
  // Checked here as well as in the layout. The Next docs are explicit that a
  // layout is not an authorisation boundary: it is not guaranteed to re-run for
  // every navigation into the routes beneath it.
  await requireAdmin();
  const params = await searchParams;
  const services = await fetchAdminServices();
  const notice = Object.keys(NOTICES).find((key) => params[key] === "1");

  // The API returns retired ones too, so they are separated rather than mixed
  // in: an admin needs to see what is live at a glance.
  const active = services.filter((s) => s.status !== "INACTIVE");
  const retired = services.filter((s) => s.status === "INACTIVE");

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold sm:text-3xl">Services</h1>
          <p className="mt-2 text-muted-foreground">
            {active.length} offered to patients when booking.
          </p>
        </div>
        <Link href="/admin/services/new" className={buttonClasses("primary", "md")}>
          Add service
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

      {active.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border-strong bg-surface p-8 text-center">
          <h2 className="font-serif text-lg font-semibold">No services yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Every appointment is booked against a service, so patients cannot book anything
            until at least one exists.
          </p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Name
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Length
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Description
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {active.map((service) => (
                <tr key={service.id} className="bg-background">
                  <th scope="row" className="px-4 py-3 font-normal">
                    <span className="font-medium">{service.name}</span>
                    <span className="block text-xs text-muted-foreground">id {service.id}</span>
                  </th>
                  <td className="px-4 py-3">{service.durationMinutes} min</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {service.description ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/services/${service.id}/edit`}
                        className={buttonClasses("outline", "sm")}
                      >
                        Edit
                      </Link>
                      <RetireService
                        id={service.id}
                        name={service.name}
                        durationMinutes={service.durationMinutes}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {retired.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Retired
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No longer offered when booking. Kept so that appointments already made against them
            still make sense.
          </p>
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
            {retired.map((service) => (
              <li
                key={service.id}
                className="flex flex-wrap gap-x-4 px-4 py-3 text-sm text-muted-foreground"
              >
                <span className="font-medium text-foreground">{service.name}</span>
                <span>{service.durationMinutes} min</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
