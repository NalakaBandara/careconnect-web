import type { Metadata } from "next";
import Link from "next/link";
import ProfessionalCard from "@/components/ProfessionalCard";
import ProfessionalFilters from "@/components/professionals/ProfessionalFilters";
import ProfessionalSearchBar from "@/components/professionals/ProfessionalSearchBar";
import { filterProfessionals, queryFromSearchParams } from "@/lib/professional-search";

export const metadata: Metadata = {
  title: "Find a healthcare professional",
  description:
    "Browse and filter healthcare professionals by speciality, service and location. Public profiles are open to everyone, no account required.",
};

// searchParams is a Promise in current Next, so it has to be awaited. Reading
// it also makes this page dynamic - it cannot be prebuilt, because the results
// depend on the query string.
export default async function ProfessionalsPage({ searchParams }: PageProps<"/professionals">) {
  const query = queryFromSearchParams(await searchParams);
  const results = await filterProfessionals(query);

  const hasFilters =
    query.term !== "" ||
    query.location !== "all" ||
    query.speciality !== "all" ||
    query.service !== "all";

  return (
    <main>
      <section className="border-b border-border bg-surface py-14">
        <div className="container-page">
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight">
            Find a healthcare professional
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
            Search by name, speciality or service. Profiles show qualifications, clinic details
            and general availability, so you only need an account when you request an
            appointment.
          </p>
          <div className="mt-8">
            <ProfessionalSearchBar defaultTerm={query.term} />
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="container-page">
          <ProfessionalFilters query={query} />

          <div className="mt-8 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {results.length} {results.length === 1 ? "professional" : "professionals"} listed
            </p>
            {hasFilters && (
              <Link
                href="/professionals"
                className="text-sm font-medium text-primary hover:underline"
              >
                Clear filters
              </Link>
            )}
          </div>

          {results.length > 0 ? (
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {results.map((professional) => (
                <ProfessionalCard key={professional.id} professional={professional} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed border-border-strong bg-surface p-8 text-center">
              <h2 className="font-serif text-lg font-semibold">
                No professionals match your search
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Try a different speciality, remove the location filter, or search by service
                instead.
              </p>
              <Link
                href="/professionals"
                className="mt-5 inline-block text-sm font-medium text-primary hover:underline"
              >
                Clear filters
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
