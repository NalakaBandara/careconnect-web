"use client";

import { useActionState, useState } from "react";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import { deleteClinicAction, type DeleteState } from "@/app/(protected)/admin/clinics/actions";

export default function DeleteClinic({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);

  // bind() fixes the id on the server, so the browser cannot point this at a
  // different clinic.
  const [state, formAction, isPending] = useActionState<DeleteState>(
    deleteClinicAction.bind(null, id),
    {},
  );

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Delete
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} titleId={`del-clinic-${id}`}>
        <h2 id={`del-clinic-${id}`} className="font-serif text-lg font-semibold">
          Delete {name}?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The clinic disappears from the public directory and the location filter straight
          away. Doctors who practise there stay listed, but lose this location.
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
              {isPending ? "Deleting…" : "Yes, delete"}
            </Button>
          </form>
        </div>
      </Modal>
    </>
  );
}
