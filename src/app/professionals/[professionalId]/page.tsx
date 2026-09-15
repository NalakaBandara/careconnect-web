import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchProfessional } from "@/lib/professionals";
import BookingGate from "@/components/professionals/BookingGate";
import { getSession } from "@/lib/session";

// No generateStaticParams here any more. Prebuilding a fixed list of ids only
// works while the data is a constant in the repo. An admin can now add and
// remove professionals at runtime, so the set of valid ids is not known at
// build time - and the API may not even be running then. These render on
// demand instead.

export async function generateMetadata({
  params,
}: PageProps<"/professionals/[professionalId]">): Promise<Metadata> {
  const { professionalId } = await params;
  const professional = await fetchProfessional(professionalId);

  if (!professional) {
    return { title: "Professional not found", robots: { index: false } };
  }

  return {
    title: `${professional.name}, ${professional.speciality}`,
    description: `${professional.name}, ${professional.speciality} at ${professional.clinic}, ${professional.location}. View services, qualifications and general availability.`,
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

  return (
    <main>
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
              <h1 className="text-3xl font-semibold sm:text-4xl">{professional.name}</h1>
              <p className="mt-2 text-lg text-primary">{professional.speciality}</p>
              <p className="mt-3 text-sm text-muted-foreground">{professional.qualifications}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {professional.clinic}, {professional.location}
              </p>
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
          <p className="mt-4 leading-relaxed text-muted-foreground">{professional.summary}</p>

          <h2 className="mt-12 text-2xl font-semibold">Available services</h2>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {professional.services.map((service) => (
              <li key={service} className="py-3.5 text-sm">
                {service}
              </li>
            ))}
          </ul>
        </div>

        <aside className="h-fit rounded-lg border border-border bg-background p-6 shadow-soft">
          <h2 className="text-lg font-semibold">General availability</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {professional.generalAvailability.map((slot) => (
              <li key={slot}>{slot}</li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-muted-foreground">
            Exact appointment times are confirmed by {professional.clinic} after you sign in.
          </p>
        </aside>
      </div>
    </main>
  );
}
