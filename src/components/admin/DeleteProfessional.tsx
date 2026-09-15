"use client";

import { useActionState, useState } from "react";
import Button from "@/components/Button";
import {
  deleteProfessionalAction,
  type DeleteState,
} from "@/app/(protected)/admin/professionals/actions";

export default function DeleteProfessional({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);

  // bind() fixes the id on the server, so the browser cannot point this at a
  // different professional.
  const [state, formAction, isPending] = useActionState<DeleteState>(
    deleteProfessionalAction.bind(null, id),
    {},
  );

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Remove
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-title-${id}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-5"
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-raised">
            <h2 id={`delete-title-${id}`} className="font-serif text-lg font-semibold">
              Remove {name} from the directory?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Their public profile will stop working immediately. Existing appointments keep
              their record, but patients will no longer be able to find or book them.
            </p>

            {state.message && (
              <p role="alert" className="mt-4 text-sm text-destructive">
                {state.message}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                Keep them
              </Button>
              <form action={formAction}>
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? "Removing…" : "Yes, remove"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
