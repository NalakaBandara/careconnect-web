"use client";

import { useActionState, useState } from "react";
import Button from "@/components/Button";
import {
  cancelAppointmentAction,
  type MutationState,
} from "@/app/(protected)/dashboard/appointments/actions";

// Cancelling is destructive and cannot be undone, so it asks first. The
// confirm step is also what stops a mis-click on a small screen from
// cancelling an appointment.
export default function CancelAppointment({
  reference,
  professionalName,
}: {
  reference: string;
  professionalName: string;
}) {
  const [open, setOpen] = useState(false);

  // bind() fixes the reference on the server, so the browser cannot swap it
  // for somebody else's. useActionState then supplies the state argument.
  const [state, formAction, isPending] = useActionState<MutationState>(
    cancelAppointmentAction.bind(null, reference),
    {},
  );

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Cancel
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`cancel-title-${reference}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-5"
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-raised">
            <h2 id={`cancel-title-${reference}`} className="font-serif text-lg font-semibold">
              Cancel this appointment?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Your appointment with {professionalName} ({reference}) will be cancelled and the
              clinic notified. You would need to book again to get the slot back.
            </p>

            {state.message && (
              <p role="alert" className="mt-4 text-sm text-destructive">
                {state.message}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                Keep appointment
              </Button>
              {/* A real <form> with a Server Action, not an onClick fetch, so
                  it still works if the JavaScript has not loaded. */}
              <form action={formAction}>
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? "Cancelling…" : "Yes, cancel it"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
