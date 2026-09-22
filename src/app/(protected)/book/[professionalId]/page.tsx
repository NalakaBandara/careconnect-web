import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppointmentSummary from "@/components/booking/AppointmentSummary";
import BookingDetailsForm from "@/components/booking/BookingDetailsForm";
import BookingSteps from "@/components/booking/BookingSteps";
import RescheduleConfirm from "@/components/booking/RescheduleConfirm";
import SlotPicker from "@/components/booking/SlotPicker";
import { canCancel, fetchAppointmentByReference } from "@/lib/appointments";
import { fetchAvailability, findDay, firstBookableDay, resolveFreeSlot } from "@/lib/booking";
import { fetchProfessional, fetchServices } from "@/lib/directory";
import { bookingAction } from "./actions";

export const metadata: Metadata = {
  title: "Book an appointment",
  robots: { index: false }, // a signed-in page has no business in search results
};

export default async function BookPage({
  params,
  searchParams,
}: PageProps<"/book/[professionalId]">) {
  const { professionalId } = await params;
  const { date, time, clinic, service, reschedule } = await searchParams;

  const [professional, services] = await Promise.all([
    fetchProfessional(professionalId),
    fetchServices(),
  ]);
  if (!professional) notFound();

  // A doctor can work at several clinics, and availability is per clinic, so
  // one has to be chosen before any times can be shown.
  const clinicId =
    (typeof clinic === "string" ? clinic : undefined) ?? professional.clinics[0]?.id;

  if (!clinicId) {
    return (
      <main id="main" className="container-page py-14">
        <h1 className="font-serif text-2xl font-semibold">Booking is not available</h1>
        <p className="mt-3 max-w-prose text-muted-foreground">
          {professional.name} is not currently listed at any clinic, so there is nowhere to book
          an appointment.
        </p>
        <Link
          href="/professionals"
          className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
        >
          Back to the directory
        </Link>
      </main>
    );
  }

  const serviceId = (typeof service === "string" ? service : undefined) ?? services[0]?.id;

  // Reschedule mode. The reference is looked up inside this user's own
  // appointments, so somebody else's is simply not found and the page falls
  // back to being an ordinary new booking.
  const ref = typeof reschedule === "string" ? reschedule : undefined;
  const moving = ref ? await fetchAppointmentByReference(ref) : null;
  const isMoving = Boolean(moving && canCancel(moving) && moving.doctor.id === professionalId);

  const days = await fetchAvailability(professionalId, clinicId);

  const chosenDate = typeof date === "string" ? date : undefined;
  const chosenTime = typeof time === "string" ? time : undefined;
  const confirmed =
    chosenDate && chosenTime ? resolveFreeSlot(days, chosenDate, chosenTime) : null;

  const activeClinic = professional.clinics.find((c) => c.id === clinicId);
  const activeService = services.find((s) => s.id === serviceId);

  if (confirmed && chosenTime && serviceId) {
    return (
      <main id="main">
        <Hero step={2} professionalName={professional.name} moving={isMoving} />

        <div className="container-page grid gap-10 py-12 lg:grid-cols-[1.4fr_0.6fr] lg:gap-16">
          <div className="rounded-lg border border-border bg-background p-6 shadow-soft sm:p-7">
            {isMoving && moving ? (
              <>
                <h2 className="font-serif text-xl font-semibold">Confirm the new time</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {moving.bookingReference} will move from {moving.longDate} at {moving.time} to{" "}
                  {confirmed.day.longDate} at {chosenTime}. The reason for the visit stays as it
                  is.
                </p>
                <div className="mt-6">
                  <RescheduleConfirm
                    reference={moving.bookingReference}
                    professionalId={professionalId}
                    clinicId={clinicId}
                    date={confirmed.day.date}
                    time={chosenTime}
                  />
                </div>
              </>
            ) : (
              <>
                <h2 className="font-serif text-xl font-semibold">Your details</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your name and contact details come from your account, so there is nothing to
                  retype.
                </p>
                <div className="mt-6">
                  <BookingDetailsForm
                    // bind() fixes the slot on the server, so the form posts
                    // only what the user typed.
                    action={bookingAction.bind(null, {
                      professionalId,
                      clinicId,
                      serviceId,
                      date: confirmed.day.date,
                      time: chosenTime,
                    })}
                    professionalId={professionalId}
                    date={confirmed.day.date}
                  />
                </div>
              </>
            )}
          </div>

          <AppointmentSummary
            title="Appointment summary"
            professional={professional}
            longDate={confirmed.day.longDate}
            time={chosenTime}
            durationMinutes={activeService?.durationMinutes ?? 30}
            clinicName={activeClinic?.name}
            serviceName={activeService?.name}
          />
        </div>
      </main>
    );
  }

  // Step 1. An unknown or full date in the URL quietly falls back to the first
  // day with space, rather than showing an empty grid.
  const requested = chosenDate ? findDay(days, chosenDate) : undefined;
  const selectedDay = requested && requested.freeCount > 0 ? requested : firstBookableDay(days);

  return (
    <main id="main">
      <Hero step={1} professionalName={professional.name} moving={isMoving} />

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1.4fr_0.6fr] lg:gap-16">
        <SlotPicker
          professionalId={professionalId}
          days={days}
          selectedDay={selectedDay}
          clinicId={clinicId}
          reschedule={isMoving ? ref : undefined}
        />

        <div className="h-fit rounded-lg border border-border bg-background p-6 shadow-soft">
          <h2 className="text-lg font-semibold">{professional.name}</h2>
          {activeClinic && (
            <p className="mt-3 text-sm text-muted-foreground">
              {activeClinic.name}
              {activeClinic.city ? `, ${activeClinic.city}` : ""}
            </p>
          )}

          {/* Only worth showing when there is actually a choice to make. */}
          {professional.clinics.length > 1 && (
            <div className="mt-4">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Also practises at
              </p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {professional.clinics
                  .filter((c) => c.id !== clinicId)
                  .map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/book/${professionalId}?clinic=${c.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {activeService && (
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              {activeService.name} appointments are {activeService.durationMinutes} minutes. The
              clinic confirms the time once your request is received.
            </p>
          )}

          <Link
            href={`/professionals/${professionalId}`}
            className="mt-5 inline-block text-sm font-medium text-primary hover:underline"
          >
            View full profile
          </Link>
        </div>
      </div>
    </main>
  );
}

function Hero({
  step,
  professionalName,
  moving,
}: {
  step: 1 | 2;
  professionalName: string;
  moving?: boolean;
}) {
  const title = moving
    ? step === 1
      ? "Choose a new time"
      : "Confirm the new time"
    : step === 1
      ? `Book with ${professionalName}`
      : "Confirm your appointment";

  return (
    <div className="border-b border-border bg-surface py-10">
      <div className="container-page">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">{title}</h1>
        <div className="mt-5">
          <BookingSteps current={step} moving={moving} />
        </div>
      </div>
    </div>
  );
}
