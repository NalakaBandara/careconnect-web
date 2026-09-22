"use client";

import { useActionState } from "react";
import Button from "@/components/Button";

type LinkState = { message?: string };
type Action = (prev: LinkState) => Promise<LinkState>;

// One row: something that is either attached or not, with a button that flips
// it. Used for a doctor's clinics and specialities, and for a clinic's
// services, because all three are the same idea.
//
// Each row is its own <form> with its own Server Action rather than one big
// form with checkboxes. That way a failure names the row it belongs to, and
// nothing is submitted that the admin did not press.
export default function LinkToggle({
  label,
  hint,
  attached,
  action,
  attachLabel = "Add",
  detachLabel = "Remove",
}: {
  label: string;
  hint?: string;
  attached: boolean;
  action: Action;
  attachLabel?: string;
  detachLabel?: string;
}) {
  const [state, formAction, isPending] = useActionState<LinkState>(action, {});

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <span className={attached ? "font-medium" : "text-muted-foreground"}>{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
        {state.message && (
          <span role="alert" className="block text-xs text-destructive">
            {state.message}
          </span>
        )}
      </div>

      <form action={formAction}>
        <Button
          type="submit"
          variant={attached ? "ghost" : "outline"}
          size="sm"
          disabled={isPending}
        >
          {isPending ? "…" : attached ? detachLabel : attachLabel}
        </Button>
      </form>
    </li>
  );
}
