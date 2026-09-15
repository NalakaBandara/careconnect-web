const BOOKING_STEPS = ["Choose a slot", "Your details", "Confirm"];

// A reschedule collects nothing, so "Your details" would be wrong there.
const RESCHEDULE_STEPS = ["Choose a new time", "Confirm", "Done"];

// Plain server component. The step number is derived from the URL by the page,
// so there is nothing to hold in state.
export default function BookingSteps({
  current,
  moving = false,
}: {
  current: 1 | 2 | 3;
  moving?: boolean;
}) {
  const STEPS = moving ? RESCHEDULE_STEPS : BOOKING_STEPS;

  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const done = step <= current;

        return (
          <li key={label} className="flex items-center gap-3">
            <span
              // aria-current tells a screen reader which step you are on.
              // Colour alone would not convey it.
              aria-current={step === current ? "step" : undefined}
              className="flex items-center gap-2"
            >
              <span
                className={
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold " +
                  (done ? "bg-primary text-white" : "bg-surface text-muted-foreground")
                }
              >
                {step}
              </span>
              <span
                className={
                  "text-sm " + (step === current ? "font-medium" : "text-muted-foreground")
                }
              >
                {label}
              </span>
            </span>
            {step < STEPS.length && (
              <span aria-hidden="true" className="hidden h-px w-8 bg-border-strong sm:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
