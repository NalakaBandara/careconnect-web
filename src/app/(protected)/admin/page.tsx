import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/Button";
import { fetchProfessionals } from "@/lib/professionals";
import { fetchServices } from "@/lib/directory";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false },
};

export default async function AdminPage() {
  // Safe to assert: admin/layout.tsx has already turned away anyone without
  // the admin role.
  const user = (await getSession())!;
  const [professionals, services] = await Promise.all([
    fetchProfessionals(),
    fetchServices(),
  ]);

  // A doctor can hold several specialities, so each one counts.
  const bySpeciality = professionals.reduce<Record<string, number>>((counts, professional) => {
    for (const speciality of professional.specialities) {
      counts[speciality] = (counts[speciality] ?? 0) + 1;
    }
    return counts;
  }, {});

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold sm:text-3xl">Administration</h1>
      <p className="mt-2 text-muted-foreground">
        Signed in as {user.email}. Only accounts holding the <strong>admin</strong> role can see
        this area.
      </p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-background p-5 shadow-soft">
          <dt className="text-sm text-muted-foreground">Professionals listed</dt>
          <dd className="mt-1 text-3xl font-semibold">{professionals.length}</dd>
        </div>
        <div className="rounded-lg border border-border bg-background p-5 shadow-soft">
          <dt className="text-sm text-muted-foreground">Specialities covered</dt>
          <dd className="mt-1 text-3xl font-semibold">{Object.keys(bySpeciality).length}</dd>
        </div>
        <div className="rounded-lg border border-border bg-background p-5 shadow-soft">
          <dt className="text-sm text-muted-foreground">Services offered</dt>
          <dd className="mt-1 text-3xl font-semibold">{services.length}</dd>
        </div>
      </dl>

      <section className="mt-10">
        <h2 className="font-serif text-xl font-semibold">Directory by speciality</h2>
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {Object.entries(bySpeciality).map(([speciality, count]) => (
            <li key={speciality} className="flex items-center justify-between py-3 text-sm">
              <span>{speciality}</span>
              <span className="text-muted-foreground">
                {count} {count === 1 ? "professional" : "professionals"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 flex flex-wrap gap-2.5">
        <Link href="/dashboard" className={buttonClasses("outline", "md")}>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
