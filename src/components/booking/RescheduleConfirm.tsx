"use client";

import { useActionState } from "react";
import Link from "next/link";
import Button, { buttonClasses } from "@/components/Button";
import {
  rescheduleAppointmentAction,
  type MutationState,
} from "@/app/(protected)/dashboard/appointments/actions";

// A reschedule only needs a confirmation - the name, contact number and reason
// were all given when the appointment was first booked. Asking again would be
// re-collecting data we already hold.
export default function RescheduleConfirm({
  reference,
  professionalId,
  date,
  time,
}: {
  reference: string;
  professionalId: string;
  date: string;
  time: string;
}) {
  const [state, formAction, isPending] = useActionState<MutationState>(
    rescheduleAppointmentAction.bind(null, { reference, professionalId, date, time }),
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.message && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Moving…" : "Confirm new time"}
        </Button>
        <Link
          href={`/book/${professionalId}?reschedule=${reference}`}
          className={buttonClasses("outline", "md")}
        >
          Choose a different time
        </Link>
      </div>
    </form>
  );
}
