"use client";

import { useActionState, useState } from "react";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import {
  retireServiceAction,
  type RetireState,
} from "@/app/(protected)/admin/services/actions";

// Retire, not delete. The API has no DELETE for a service, and that is the
// right call: appointments already booked against it keep their record, which
// a hard delete would break. Marking it inactive stops it being offered while
// leaving history intact.
export default function RetireService({
  id,
  name,
  durationMinutes,
}: {
  id: string;
  name: string;
  durationMinutes: number;
}) {
  const [open, setOpen] = useState(false);

  const [state, formAction, isPending] = useActionState<RetireState>(
    retireServiceAction.bind(null, { id, name, durationMinutes }),
    {},
  );

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Retire
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} titleId={`retire-${id}`}>
        <h2 id={`retire-${id}`} className="font-serif text-lg font-semibold">
          Retire {name}?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          It stops being offered on the booking page straight away. Appointments already booked
          against it keep their record, which is why this hides the service rather than
          deleting it.
        </p>

        {state.message && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {state.message}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Keep it
          </Button>
          <form action={formAction}>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Retiring…" : "Yes, retire"}
            </Button>
          </form>
        </div>
      </Modal>
    </>
  );
}
