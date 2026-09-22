"use client";

import { useActionState } from "react";
import Link from "next/link";
import Button, { buttonClasses } from "@/components/Button";
import Input from "@/components/Input";
import type { BookingState } from "@/app/(protected)/book/[professionalId]/actions";

type Action = (prev: BookingState, formData: FormData) => Promise<BookingState>;

// The API stores a reason and nothing else, so that plus consent is all this
// asks for. The old version collected a name and contact number as well, which
// the account already holds; asking again would be collecting them twice and
// giving the clinic two versions to reconcile.
export default function BookingDetailsForm({
  action,
  professionalId,
  date,
}: {
  action: Action;
  professionalId: string;
  date: string;
}) {
  const [state, formAction, isPending] = useActionState(action, {});

  const errorFor = (name: "reason" | "consent") => state.fields?.[name]?.[0];

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.message && (
        // role="alert" makes a screen reader announce this the moment it
        // appears, rather than the user having to go looking for it.
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="reason" className="text-sm font-medium">
          Reason for visit
        </label>
        <Input
          id="reason"
          name="reason"
          defaultValue={state.values?.reason}
          // aria-invalid marks the field itself as wrong; aria-describedby ties
          // the message to it, so a screen reader reads both together.
          aria-invalid={errorFor("reason") ? true : undefined}
          aria-describedby={errorFor("reason") ? "reason-error" : undefined}
          className={errorFor("reason") ? "border-destructive" : ""}
        />
        {errorFor("reason") && (
          <p id="reason-error" className="text-sm text-destructive">
            {errorFor("reason")}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-start gap-2.5">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            aria-invalid={errorFor("consent") ? true : undefined}
            aria-describedby={errorFor("consent") ? "consent-error" : undefined}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <label htmlFor="consent" className="text-sm leading-relaxed text-muted-foreground">
            I agree that my details may be shared with this clinic to confirm the appointment.
          </label>
        </div>
        {errorFor("consent") && (
          <p id="consent-error" className="text-sm text-destructive">
            {errorFor("consent")}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Confirming…" : "Confirm booking"}
        </Button>
        {/* Built here rather than passed in as a finished string: typedRoutes
            can only check a template literal where it is written. */}
        <Link
          href={`/book/${professionalId}?date=${date}`}
          className={buttonClasses("outline", "md")}
        >
          Back
        </Link>
      </div>
    </form>
  );
}
