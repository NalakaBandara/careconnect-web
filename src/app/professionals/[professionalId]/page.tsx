import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BookingGate from "@/components/professionals/BookingGate";
import { fetchProfessional } from "@/lib/directory";
import { clinicLine, experienceLine, specialityLine } from "@/lib/professional-format";
import { getSession } from "@/lib/session";

// No generateStaticParams. The directory is edited through the API at runtime,
// so which ids exist is not known at build time, and the API may not even be
// running when the build happens. These render on demand.

export async function generateMetadata({
  params,
}: PageProps<"/professionals/[professionalId]">): Promise<Metadata> {
  const { professionalId } = await params;
  const professional = await fetchProfessional(professionalId);

  if (!professional) {
    return { title: "Professional not found", robots: { index: false } };
  }

  return {
    title: `${professional.name}, ${specialityLine(professional)}`,
    description: `${professional.name} at ${clinicLine(professional)}. View qualifications, clinics and availability.`,
  };
}

export default async function ProfessionalPage({
  params,
}: PageProps<"/professionals/[professionalId]">) {
  const { professionalId } = await params;
  const professional = await fetchProfessional(professionalId);

  // notFound() throws, so nothing below it runs. It renders the nearest
  // not-found page rather than a broken page with empty fields.
  if (!professional) notFound();

  const session = await getSession();
  const experience = experienceLine(professional);

  return (
    <main id="main">
      <div className="border-b border-border bg-surface py-12">
        <div className="container-page">
          <Link
            href="/professionals"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Back to all professionals
          </Link>

          <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-start">
            <Image
              src={professional.photo}
              alt={professional.photoAlt}
              width={320}
              height={320}
              className="h-40 w-40 rounded-lg border border-border object-cover shadow-soft"
            />
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
                  {professional.name}
                </h1>
                {/* The API verifies a doctor's licence, so patients should be
                    able to see that it was checked. */}
                {professional.isVerified && (
                  <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
                    Licence verified
                  </span>
                )}
              </div>

              {professional.specialities.length > 0 && (
                <p className="mt-2 text-lg text-primary">{specialityLine(professional)}</p>
              )}
              {experience && (
                <p className="mt-3 text-sm text-muted-foreground">{experience}</p>
              )}
              <p className="mt-1.5 text-sm text-muted-foreground">{clinicLine(professional)}</p>

              <div className="mt-6">
                <BookingGate
                  professionalName={professional.name}
                  isLoggedIn={session !== null}
                  professionalId={professional.id}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1.3fr_0.7fr] lg:gap-16">
        <div>
          <h2 className="text-2xl font-semibold">Professional summary</h2>
          {professional.summary ? (
            <p className="mt-4 leading-relaxed text-muted-foreground">{professional.summary}</p>
          ) : (
            <p className="mt-4 leading-relaxed text-muted-foreground">
              This professional has not added a summary yet. The clinic can tell you more when
              you book.
            </p>
          )}

          {professional.specialities.length > 0 && (
            <>
              <h2 className="mt-12 text-2xl font-semibold">Specialities</h2>
              <ul className="mt-4 divide-y divide-border border-y border-border">
                {professional.specialities.map((speciality) => (
                  <li key={speciality} className="py-3.5 text-sm">
                    {speciality}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <aside className="h-fit rounded-lg border border-border bg-background p-6 shadow-soft">
          <h2 className="text-lg font-semibold">
            {professional.clinics.length === 1 ? "Where they practise" : "Where they practise"}
          </h2>

          {professional.clinics.length > 0 ? (
            <ul className="mt-4 space-y-3 text-sm">
              {professional.clinics.map((clinic) => (
                <li key={clinic.id}>
                  <span className="font-medium">{clinic.name}</span>
                  {clinic.city && (
                    <span className="block text-muted-foreground">{clinic.city}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No clinic has been listed for this professional yet.
            </p>
          )}

          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            Appointment times are confirmed by the clinic once you have signed in and made a
            request.
          </p>
        </aside>
      </div>
    </main>
  );
}
