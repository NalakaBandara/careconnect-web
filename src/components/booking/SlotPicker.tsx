import Link from "next/link";
import type { SlotDay } from "@/types";

// No "use client" and no useState. Choosing a day or a time is a navigation,
// so every choice is a <Link> and the URL holds the selection. A taken slot is
// rendered as a disabled button because there is nowhere for it to go.
export default function SlotPicker({
  professionalId,
  days,
  selectedDay,
  reschedule,
}: {
  professionalId: string;
  days: SlotDay[];
  selectedDay: SlotDay | undefined;
  reschedule?: string;
}) {
  // Carried through every link so a reschedule keeps moving the existing
  // appointment rather than quietly turning into a new booking.
  const keep = reschedule ? `&reschedule=${reschedule}` : "";

  return (
    <div>
      <h2 className="text-lg font-semibold">Choose a day</h2>

      <ul className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {days.map((day) => {
          const isSelected = day.date === selectedDay?.date;
          const isFull = day.freeCount === 0;

          const content = (
            <>
              <span className="text-xs">{day.weekday}</span>
              <span className="text-base font-semibold">{day.dayMonth.split(" ")[0]}</span>
              <span className="text-[0.7rem]">{isFull ? "Full" : `${day.freeCount} free`}</span>
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
          There are no free appointments in the next seven days. Please check back, or contact the
          clinic directly.
        </p>
      )}
    </div>
  );
}
