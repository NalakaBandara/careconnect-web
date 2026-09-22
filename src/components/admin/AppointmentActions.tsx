"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import {
  checkInAction,
  setStatusAction,
  type StatusState,
} from "@/app/(protected)/admin/appointments/actions";
import type { AppointmentStatus } from "@/types";

// Which moves are allowed from where. A completed appointment cannot go back
// to pending, and a cancelled one is finished. Encoding it here means the
// buttons offered are always the ones that would actually work.
const NEXT: Partial<Record<AppointmentStatus, { status: string; label: string }[]>> = {
  PENDING: [
    { status: "CONFIRMED", label: "Confirm" },
    { status: "CANCELLED", label: "Cancel" },
  ],
  CONFIRMED: [
    { status: "COMPLETED", label: "Mark completed" },
    { status: "NO_SHOW", label: "Mark missed" },
    { status: "CANCELLED", label: "Cancel" },
  ],
};

export default function AppointmentActions({
  id,
  status,
}: {
  id: string;
  status: AppointmentStatus;
}) {
  const moves = NEXT[status] ?? [];

  if (moves.length === 0) {
    return <span className="text-xs text-muted-foreground">No further action</span>;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {moves.map((move) => (
        <StatusButton key={move.status} id={id} status={move.status} label={move.label} />
      ))}
      {status === "CONFIRMED" && <CheckInButton id={id} />}
    </div>
  );
}

function StatusButton({ id, status, label }: { id: string; status: string; label: string }) {
  // bind() fixes the appointment and the target status on the server, so the
  // browser cannot rewrite either.
  const [state, formAction, isPending] = useActionState<StatusState>(
    setStatusAction.bind(null, { id, status }),
    {},
  );

  return (
    // A real form with a Server Action, not an onClick fetch, so it still
    // works before the JavaScript has loaded.
    <form action={formAction}>
      <Button
        type="submit"
        variant={status === "CANCELLED" ? "ghost" : "outline"}
        size="sm"
        disabled={isPending}
      >
        {isPending ? "…" : label}
      </Button>
      {state.message && (
        <span role="alert" className="block text-xs text-destructive">
          {state.message}
        </span>
      )}
    </form>
  );
}

function CheckInButton({ id }: { id: string }) {
  const [state, formAction, isPending] = useActionState<StatusState>(
    checkInAction.bind(null, id),
    {},
  );

  return (
    <form action={formAction}>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "…" : "Check in"}
      </Button>
      {state.message && (
        <span role="alert" className="block text-xs text-destructive">
          {state.message}
        </span>
      )}
    </form>
  );
}
