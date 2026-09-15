import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchProfessional } from "@/lib/professionals";
import AppointmentSummary from "@/components/booking/AppointmentSummary";
import BookingDetailsForm from "@/components/booking/BookingDetailsForm";
import BookingSteps from "@/components/booking/BookingSteps";
import SlotPicker from "@/components/booking/SlotPicker";
import RescheduleConfirm from "@/components/booking/RescheduleConfirm";
import { fetchAppointment, canCancel } from "@/lib/appointments";
import { bookingAction } from "./actions";
import { firstBookableDay, findDay, resolveFreeSlot, SLOT_DURATION_MINUTES } from "@/lib/slots";
import { fetchSlotDays } from "@/lib/professionals";

export const metadata: Metadata = {
  title: "Book an appointment",
  robots: { index: false }, // a signed-in page has no business in search results
};

export default async function BookPage({
  params,
  searchParams,
}: PageProps<"/book/[professionalId]">) {
  const { professionalId } = await params;
  const { date, time, reschedule } = await searchParams;

  const professional = await fetchProfessional(professionalId);
  if (!professional) notFound();

  // Reschedule mode. The reference is looked up server-side and scoped to this
  // user, so a reference belonging to someone else finds nothing and the page
  // falls back to being an ordinary new booking.
  const ref = typeof reschedule === "string" ? reschedule : undefined;
  const moving = ref ? await fetchAppointment(ref) : null;
  const isMoving = Boolean(moving && canCancel(moving) && moving.professionalId === professionalId);

  // Fetched, not generated: these days already have other patients' bookings
  // marked as taken, so two people cannot be shown the same free slot.
  const days = await fetchSlotDays(professionalId);

  // Step 2 only if BOTH a date and a time are in the URL, and the pair is a
  // real free slot. Anything else falls back to step 1 rather than trusting it.
  const chosenDate = typeof date === "string" ? date : undefined;
  const chosenTime = typeof time === "string" ? time : undefined;
  const confirmedDay =
    chosenDate && chosenTime ? resolveFreeSlot(days, chosenDate, chosenTime) : null;

  if (confirmedDay && chosenTime) {
    return (
      <main id="main">
        <Hero step={2} professionalName={professional.name} moving={isMoving} />

        <div className="container-page grid gap-10 py-12 lg:grid-cols-[1.4fr_0.6fr] lg:gap-16">
          <div className="rounded-lg border border-border bg-background p-6 shadow-soft sm:p-7">
            {isMoving && moving ? (
              <>
                <h2 className="font-serif text-xl font-semibold">Confirm the new time</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {moving.reference} will move from {moving.longDate} at {moving.time} to{" "}
                  {confirmedDay.longDate} at {chosenTime}. Your contact details and the reason
                  for the visit stay as they are.
                </p>
                <div className="mt-6">
                  <RescheduleConfirm
                    reference={moving.reference}
                    professionalId={professionalId}
                    date={confirmedDay.date}
                    time={chosenTime}
                  />
                </div>
              </>
            ) : (
              <>
            <h2 className="font-serif text-xl font-semibold">Your details</h2>
            <div className="mt-6">
              <BookingDetailsForm
                // bind() fixes the slot on the server. The form posts only the
                // fields the user typed.
                action={bookingAction.bind(null, {
                  professionalId,
                  date: confirmedDay.date,
                  time: chosenTime,
                })}
                professionalId={professionalId}
                date={confirmedDay.date}
              />
            </div>
              </>
            )}
          </div>

          <AppointmentSummary
            title="Appointment summary"
            professional={professional}
            longDate={confirmedDay.longDate}
            time={chosenTime}
            durationMinutes={SLOT_DURATION_MINUTES}
          />
        </div>
      </main>
    );
  }

  // Step 1. An unknown or full date in the URL quietly falls back to the first
  // day that has space, rather than showing an empty grid.
  const requested = chosenDate ? findDay(days, chosenDate) : undefined;
  const selectedDay =
    requested && requested.freeCount > 0 ? requested : firstBookableDay(days);

  return (
    <main id="main">
      <Hero step={1} professionalName={professional.name} moving={isMoving} />

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1.4fr_0.6fr] lg:gap-16">
        <SlotPicker
          professionalId={professionalId}
          days={days}
          selectedDay={selectedDay}
          reschedule={isMoving ? ref : undefined}
        />

        <div className="h-fit rounded-lg border border-border bg-background p-6 shadow-soft">
          <h2 className="text-lg font-semibold">{professional.name}</h2>
          <p className="mt-1 text-sm text-primary">{professional.speciality}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            {professional.clinic}, {professional.location}
          </p>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            Appointments are {SLOT_DURATION_MINUTES} minutes. The clinic confirms the exact time
            once your request is received.
          </p>
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
