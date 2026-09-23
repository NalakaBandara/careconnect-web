import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ScheduleForm from "@/components/admin/ScheduleForm";
import { fetchAdminClinics } from "@/lib/admin";
import { fetchSchedules } from "@/lib/booking";
import { fetchProfessional } from "@/lib/directory";
import { createScheduleAction } from "../../actions";
import { requireAdmin } from "@/lib/guards";

export const metadata: Metadata = { title: "Working hours", robots: { index: false } };

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export default async function SchedulesPage({
  params,
  searchParams,
}: PageProps<"/admin/doctors/[doctorId]/schedules">) {
  // Checked here as well as in the layout. The Next docs are explicit that a
  // layout is not an authorisation boundary: it is not guaranteed to re-run for
  // every navigation into the routes beneath it.
  await requireAdmin();
  const { doctorId } = await params;
  const { added } = await searchParams;

  const [doctor, schedules, clinics] = await Promise.all([
    fetchProfessional(doctorId),
    fetchSchedules(doctorId),
    fetchAdminClinics(),
  ]);
  if (!doctor) notFound();

  const clinicName = (id: string) => clinics.find((c) => c.id === id)?.name ?? `Clinic ${id}`;
  const sorted = [...schedules].sort(
    (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek),
  );

  return (
    <div>
      <Link href="/admin/doctors" className="text-sm text-muted-foreground hover:text-foreground">
        Back to doctors
      </Link>

      <h1 className="mt-6 font-serif text-2xl font-semibold sm:text-3xl">
        {doctor.name}: working hours
      </h1>
      <p className="mt-2 max-w-prose text-muted-foreground">
        These repeat every week. Bookable times come from combining them with the calendar, so
        a doctor with no hours here cannot be booked at all.
      </p>

      {added === "1" && (
        <p
          role="status"
          className="mt-6 rounded-md border border-primary/30 bg-primary-soft px-4 py-3 text-sm"
        >
          The working hours have been added. Appointments can be booked in them straight away.
        </p>
      )}

      <h2 className="mt-8 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        Current hours
      </h2>

      {sorted.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-border-strong bg-surface p-6 text-sm text-muted-foreground">
          None set, so {doctor.name} cannot currently be booked.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
          {sorted.map((schedule) => (
            <li key={schedule.id} className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-3 text-sm">
              <span className="font-medium capitalize">{schedule.dayOfWeek.toLowerCase()}</span>
              <span>
                {schedule.startTime.slice(0, 5)} to {schedule.endTime.slice(0, 5)}
              </span>
              <span className="text-muted-foreground">{clinicName(schedule.clinicId)}</span>
              <span className="text-muted-foreground">
                {schedule.slotDurationMinutes} minute appointments
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 font-serif text-xl font-semibold">Add working hours</h2>
      <div className="mt-4 max-w-2xl">
        <ScheduleForm action={createScheduleAction.bind(null, doctorId)} clinics={clinics} />
      </div>
    </div>
  );
}
