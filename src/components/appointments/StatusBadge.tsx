import type { AppointmentStatus } from "@/types";

// Label and colour per status. A Record keyed by the union type means adding a
// status to AppointmentStatus is a type error here until it is handled.
const STATUS: Record<AppointmentStatus, { label: string; className: string }> = {
  confirmed: { label: "Confirmed", className: "bg-primary-soft text-primary" },
  awaiting: { label: "Awaiting clinic", className: "bg-surface text-muted-foreground" },
  completed: { label: "Completed", className: "bg-surface text-muted-foreground" },
  cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive" },
};

export default function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { label, className } = STATUS[status];

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
