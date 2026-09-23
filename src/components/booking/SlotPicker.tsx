import Link from "next/link";
import type { SlotDay } from "@/types";

// No "use client" and no useState. Choosing a day or a time is a navigation,
// so every choice is a <Link> and the URL holds the selection. A taken slot is
// rendered as a disabled button because there is nowhere for it to go.
export default function SlotPicker({
  professionalId,
  days,
  selectedDay,
  clinicId,
  reschedule,
}: {
  professionalId: string;
  days: SlotDay[];
  selectedDay: SlotDay | undefined;
  clinicId: string;
  reschedule?: string;
}) {
  // Carried through every link: the clinic because availability is per clinic,
  // and the reference so a reschedule keeps moving the existing appointment
  // rather than quietly turning into a new booking.
  const keep = `&clinic=${clinicId}${reschedule ? `&reschedule=${reschedule}` : ""}`;

  const unknownCount = days.filter((day) => day.unknown).length;

  return (
    <div>
      <h2 className="text-lg font-semibold">Choose a day</h2>

      {unknownCount > 0 && (
        // role="status" so a screen reader is told, rather than the user only
        // finding out by noticing a day they cannot click.
        <p
          role="status"
          className="mt-3 rounded-md border border-border-strong bg-surface px-4 py-3 text-sm text-muted-foreground"
        >
          Times for {unknownCount === 1 ? "one day" : `${unknownCount} days`} could not be
          loaded, so {unknownCount === 1 ? "it is" : "they are"} shown as not loaded rather than
          full. Reloading the page usually fixes it.
        </p>
      )}

      <ul className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {days.map((day) => {
          const isSelected = day.date === selectedDay?.date;
          // Unknown days are not offered either, but they must not claim to be
          // full: that would be telling the patient something we do not know.
          const isFull = day.freeCount === 0 || day.unknown === true;

          const content = (
            <>
              <span className="text-xs">{day.weekday}</span>
              <span className="text-base font-semibold">{day.dayMonth.split(" ")[0]}</span>
              <span className="text-[0.7rem]">
                {day.unknown ? "Not loaded" : isFull ? "Full" : `${day.freeCount} free`}
              </span>
            </>
          );

          const shared =
            "flex h-[4.5rem] w-full flex-col items-center justify-center gap-0.5 rounded-lg border text-center";

          if (isFull) {
            return (
              <li key={day.date}>
                <span
                  aria-disabled="true"
                  className={`${shared} border-border bg-surface text-muted-foreground`}
                >
                  {content}
                </span>
              </li>
            );
          }

          return (
            <li key={day.date}>
              <Link
                href={`/book/${professionalId}?date=${day.date}${keep}`}
                aria-current={isSelected ? "true" : undefined}
                className={
                  `${shared} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ` +
                  (isSelected
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-background hover:border-border-strong hover:bg-surface")
                }
              >
                {content}
              </Link>
            </li>
          );
        })}
      </ul>

      {selectedDay ? (
        <div className="mt-10 space-y-8">
          <h2 className="text-lg font-semibold">
            Choose a time on {selectedDay.longDate}
          </h2>

          {selectedDay.groups.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {group.label}
              </p>
              <ul className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-5 lg:grid-cols-6">
                {group.slots.map((slot) => (
                  <li key={slot.time}>
                    {slot.taken ? (
                      <button
                        type="button"
                        disabled
                        className="h-11 w-full rounded-md border border-border bg-surface text-sm text-muted-foreground opacity-55"
                      >
                        {slot.time}
                      </button>
                    ) : (
                      <Link
                        href={`/book/${professionalId}?date=${selectedDay.date}&time=${slot.time}${keep}`}
                        className="flex h-11 w-full items-center justify-center rounded-md border border-border-strong bg-background text-sm font-medium hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        {slot.time}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-lg border border-dashed border-border-strong bg-surface p-6 text-sm text-muted-foreground">
          {days.some((day) => day.unknown)
            ? "We could not load the times for some days. Please reload the page in a moment, or contact the clinic directly."
            : "There are no free appointments at this clinic in the next two weeks. Please check back, or contact the clinic directly."}
        </p>
      )}
    </div>
  );
}
