import Link from "next/link";

import { buttonClasses } from "@/components/Button";
import CheckInQr from "@/components/appointments/CheckInQr";

// The check-in code on an appointment's page. Only a confirmed appointment has
// one: until the clinic accepts the booking there is nothing to check in to,
// so a pending booking says when the code will appear instead.
export default function CheckInCard({
  reference,
  confirmed,
}: {
  reference: string;
  confirmed: boolean;
}) {
  return (
    <section className="rounded-lg border border-border bg-background p-6 text-center shadow-soft">
      <h2 className="font-sans text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        Check-in code
      </h2>

      {confirmed ? (
        <>
          <div className="mt-4 flex justify-center text-foreground">
            <CheckInQr reference={reference} />
          </div>
          <p className="mt-3 text-lg font-semibold tracking-wider">{reference}</p>
          <Link
            href={`/dashboard/appointments/${reference}/check-in`}
            className={`${buttonClasses("primary", "md")} mt-4 w-full`}
          >
            Open check-in
          </Link>
        </>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your check-in code will appear here once the clinic confirms the appointment.
        </p>
      )}
    </section>
  );
}
