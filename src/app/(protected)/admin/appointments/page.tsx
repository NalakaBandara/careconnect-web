import type { Metadata } from "next";
import AppointmentActions from "@/components/admin/AppointmentActions";
import StatusBadge from "@/components/appointments/StatusBadge";
import { fetchAllAppointments } from "@/lib/admin";
import { longDate, todayIso } from "@/lib/date-format";
import type { AppointmentStatus } from "@/types";

export const metadata: Metadata = { title: "Appointments", robots: { index: false } };

const ACTIVE: AppointmentStatus[] = ["PENDING", "CONFIRMED"];

export default async function AdminAppointmentsPage({
  searchParams,
}: PageProps<"/admin/appointments">) {
  const { tab } = await searchParams;
  const showPast = tab === "past";

  const all = await fetchAllAppointments();
  const today = todayIso();

  const upcoming = all
    .filter((a) => a.appointmentDate >= today && ACTIVE.includes(a.status))
    .sort((a, b) =>
      `${a.appointmentDate}${a.startTime}`.localeCompare(`${b.appointmentDate}${b.startTime}`),
    );

  const past = all
    .filter((a) => a.appointmentDate < today || !ACTIVE.includes(a.status))
    // Past appointments read best newest first, unlike upcoming ones.
    .sort((a, b) =>
      `${b.appointmentDate}${b.startTime}`.localeCompare(`${a.appointmentDate}${a.startTime}`),
    );

  const shown = showPast ? past : upcoming;

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold sm:text-3xl">Appointments</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">
        Every appointment in the system. Confirm a request, mark one completed or missed, or
        check a patient in when they arrive.
      </p>

      {/* Tabs are links, so the back button works and a view can be shared. */}
      <nav
        aria-label="Appointment filter"
        className="mt-6 inline-flex rounded-md border border-border bg-background p-1"
      >
        <a
          href="/admin/appointments"
          aria-current={!showPast ? "page" : undefined}
          className={
            "rounded px-4 py-1.5 text-sm " +
            (!showPast ? "bg-surface font-medium" : "text-muted-foreground hover:text-foreground")
          }
        >
          Upcoming ({upcoming.length})
        </a>
        <a
          href="/admin/appointments?tab=past"
          aria-current={showPast ? "page" : undefined}
          className={
            "rounded px-4 py-1.5 text-sm " +
            (showPast ? "bg-surface font-medium" : "text-muted-foreground hover:text-foreground")
          }
        >
          Past and closed ({past.length})
        </a>
      </nav>

      {shown.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border-strong bg-surface p-8 text-center">
          <h2 className="font-serif text-lg font-semibold">
            {showPast ? "Nothing here yet" : "No upcoming appointments"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {showPast
              ? "Appointments that have been completed, cancelled or missed appear here."
              : "Requests appear here as soon as patients make them."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Reference
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  When
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Doctor and clinic
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shown.map((appointment) => (
                <tr key={appointment.id} className="bg-background">
                  <th scope="row" className="px-4 py-3 font-normal">
                    <span className="font-medium">{appointment.bookingReference}</span>
                    <span className="block text-xs text-muted-foreground">
                      {appointment.reason ?? "No reason given"}
                    </span>
                  </th>
                  <td className="px-4 py-3">
                    {longDate(appointment.appointmentDate)}
                    <span className="block text-xs text-muted-foreground">
                      {appointment.startTime.slice(0, 5)} to {appointment.endTime.slice(0, 5)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {appointment.doctor
                      ? `${appointment.doctor.firstName} ${appointment.doctor.lastName}`
                      : "—"}
                    <span className="block text-xs">{appointment.clinic?.name ?? ""}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={appointment.status} />
                  </td>
                  <td className="px-4 py-3">
                    <AppointmentActions id={appointment.id} status={appointment.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
