"use client";

import { useState } from "react";
import Link from "next/link";
import Button, { buttonClasses } from "@/components/Button";

// Guests get a dialog explaining why they cannot book yet. Signed-in users go
// straight through. Whether someone is logged in is decided on the SERVER and
// passed in as a prop, so this component never reads the session itself.
export default function BookingGate({
  professionalName,
  isLoggedIn,
  professionalId,
}: {
  professionalName: string;
  isLoggedIn: boolean;
  professionalId: string;
}) {
  const [open, setOpen] = useState(false);

  if (isLoggedIn) {
    return (
      <Link href={`/book/${professionalId}`} className={buttonClasses("primary", "md")}>
        View appointment options
      </Link>
    );
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>View appointment options</Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="gate-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-5"
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-raised">
            <h2 id="gate-title" className="font-serif text-lg font-semibold">
              You need to log in or create an account before booking an appointment.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Appointment options for {professionalName} are available once you are signed in.
              Browsing profiles and services stays open to everyone.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Continue browsing
              </Button>
              <Link href="/login" className={buttonClasses("outline", "md")}>
                Log in
              </Link>
              <Link href="/register" className={buttonClasses("primary", "md")}>
                Register
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
