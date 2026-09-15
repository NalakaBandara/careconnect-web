import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfessionalById } from "@/data/professionals";
import AppointmentSummary from "@/components/booking/AppointmentSummary";
import BookingDetailsForm from "@/components/booking/BookingDetailsForm";
import BookingSteps from "@/components/booking/BookingSteps";
import SlotPicker from "@/components/booking/SlotPicker";
import { bookingAction } from "./actions";
import {
  firstBookableDay,
  findDay,
  getSlotDays,
  resolveFreeSlot,
  SLOT_DURATION_MINUTES,
} from "@/lib/slots";

export const metadata: Metadata = {
  title: "Book an appointment",
  robots: { index: false }, // a signed-in page has no business in search results
};

export default async function BookPage({
  params,
  searchParams,
}: PageProps<"/book/[professionalId]">) {
  const { professionalId } = await params;
  const { date, time } = await searchParams;

  const professional = getProfessionalById(professionalId);
  if (!professional) notFound();

  const days = getSlotDays(professionalId);

  // Step 2 only if BOTH a date and a time are in the URL, and the pair is a
  // real free slot. Anything else falls back to step 1 rather than trusting it.
  const chosenDate = typeof date === "string" ? date : undefined;
  const chosenTime = typeof time === "string" ? time : undefined;
  const confirmedDay =
    chosenDate && chosenTime ? resolveFreeSlot(professionalId, chosenDate, chosenTime) : null;

  if (confirmedDay && chosenTime) {
    return (
      <main>
        <Hero step={2} professionalName={professional.name} />

        <div className="container-page grid gap-10 py-12 lg:grid-cols-[1.4fr_0.6fr] lg:gap-16">
          <div className="rounded-lg border border-border bg-background p-6 shadow-soft sm:p-7">
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
                backHref={`/book/${professionalId}?date=${confirmedDay.date}`}
              />
            </div>
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
    <main>
      <Hero step={1} professionalName={professional.name} />

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1.4fr_0.6fr] lg:gap-16">
        <SlotPicker professionalId={professionalId} days={days} selectedDay={selectedDay} />

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

function Hero({ step, professionalName }: { step: 1 | 2; professionalName: string }) {
  return (
    <div className="border-b border-border bg-surface py-10">
      <div className="container-page">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
          {step === 1 ? `Book with ${professionalName}` : "Confirm your appointment"}
        </h1>
        <div className="mt-5">
          <BookingSteps current={step} />
        </div>
      </div>
    </div>
  );
}
