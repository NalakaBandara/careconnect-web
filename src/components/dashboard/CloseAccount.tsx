"use client";

import { useActionState, useState } from "react";

import Button from "@/components/Button";
import Modal from "@/components/Modal";
import {
  closeAccountAction,
  type CloseAccountState,
} from "@/app/(protected)/dashboard/actions";

// Closing an account cannot be undone, so it takes two deliberate steps: open
// the dialog, then tick the box and confirm. A single click is too easy to hit
// by accident on a phone.
export default function CloseAccount() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<CloseAccountState, FormData>(
    closeAccountAction,
    {},
  );

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Close my account
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} titleId="close-account-title">
        <h2 id="close-account-title" className="font-serif text-lg font-semibold">
          Close your account?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your name, email and phone number will be removed and you will be logged out. You
          will not be able to log in again. Your past appointments stay on record for the
          clinic, but without your details attached.
        </p>

        {state.message && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {state.message}
          </p>
        )}

        {/* A real <form> with a Server Action, so it still works if the
            JavaScript has not loaded. */}
        <form action={formAction} className="mt-5 space-y-5">
          <div className="flex items-start gap-2.5">
            <input
              id="confirm-close"
              name="confirm"
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <label htmlFor="confirm-close" className="text-sm leading-relaxed">
              I understand this cannot be undone.
            </label>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Keep my account
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Closing…" : "Close my account"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
