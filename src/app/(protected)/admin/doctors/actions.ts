"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSchedule, promoteToDoctor, updateDoctor } from "@/lib/admin";
import { getSession, isAdmin } from "@/lib/session";

export type DoctorFormState = {
  message?: string;
  fields?: Record<string, string[]>;
  values?: Record<string, string>;
};

async function requireAdmin() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/forbidden");
}

// A doctor shows in the directory, on their own profile and on the home page.
function revalidateEverywhere(id?: string) {
  revalidatePath("/admin/doctors");
  revalidatePath("/professionals");
  revalidatePath("/");
  if (id) revalidatePath(`/professionals/${id}`);
}

const promoteSchema = z.object({
  userId: z.string().trim().min(1, "Choose the registered user to promote"),
  licenseNumber: z.string().trim().min(1, "Enter their licence number"),
  bio: z.string().trim().max(1000, "Please keep this under 1000 characters"),
  yearsOfExperience: z
    .string()
    .trim()
    .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
      message: "Enter a number of years, or leave it blank",
    }),
});

// Creating a doctor means promoting somebody who already has an account. There
// is no way to conjure one from nothing, which is why the form starts by
// choosing a registered user rather than typing a name.
export async function promoteDoctorAction(
  _prev: DoctorFormState,
  formData: FormData,
): Promise<DoctorFormState> {
  await requireAdmin();

  const values = {
    userId: String(formData.get("userId") ?? ""),
    licenseNumber: String(formData.get("licenseNumber") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    yearsOfExperience: String(formData.get("yearsOfExperience") ?? ""),
  };

  const parsed = promoteSchema.safeParse(values);
  if (!parsed.success) {
    return {
      message: "Please check the highlighted fields",
      fields: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  // Checkboxes send one entry per ticked box, so getAll is what collects them.
  const specialtyIds = formData.getAll("specialtyIds").map(String).filter(Boolean);
  const clinicIds = formData.getAll("clinicIds").map(String).filter(Boolean);

  const { error } = await promoteToDoctor({
    userId: parsed.data.userId,
    licenseNumber: parsed.data.licenseNumber,
    ...(parsed.data.bio ? { bio: parsed.data.bio } : {}),
    ...(parsed.data.yearsOfExperience
      ? { yearsOfExperience: Number(parsed.data.yearsOfExperience) }
      : {}),
    ...(specialtyIds.length ? { specialtyIds } : {}),
    ...(clinicIds.length ? { clinicIds } : {}),
  });

  if (error) return { message: error, values };

  revalidateEverywhere();
  redirect("/admin/doctors?added=1");
}

const editSchema = z.object({
  bio: z.string().trim().max(1000, "Please keep this under 1000 characters"),
  yearsOfExperience: z
    .string()
    .trim()
    .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
      message: "Enter a number of years, or leave it blank",
    }),
});

export async function updateDoctorAction(
  id: string,
  _prev: DoctorFormState,
  formData: FormData,
): Promise<DoctorFormState> {
  await requireAdmin();

  const values = {
    bio: String(formData.get("bio") ?? ""),
    yearsOfExperience: String(formData.get("yearsOfExperience") ?? ""),
  };

  const parsed = editSchema.safeParse(values);
  if (!parsed.success) {
    return {
      message: "Please check the highlighted fields",
      fields: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  const { error } = await updateDoctor(id, {
    bio: parsed.data.bio,
    ...(parsed.data.yearsOfExperience
      ? { yearsOfExperience: Number(parsed.data.yearsOfExperience) }
      : {}),
    // A ticked box sends "on"; an unticked one sends nothing at all.
    isVerified: formData.get("isVerified") === "on",
  });

  if (error) return { message: error, values };

  revalidateEverywhere(id);
  redirect(`/admin/doctors?saved=1`);
}

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

const scheduleSchema = z.object({
  clinicId: z.string().trim().min(1, "Choose a clinic"),
  dayOfWeek: z.enum(DAYS, { message: "Choose a day" }),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Use a time like 09:00"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Use a time like 17:00"),
  slotDurationMinutes: z
    .string()
    .refine((v) => Number(v) > 0, { message: "Choose how long each appointment is" }),
});

export async function createScheduleAction(
  doctorId: string,
  _prev: DoctorFormState,
  formData: FormData,
): Promise<DoctorFormState> {
  await requireAdmin();

  const values = {
    clinicId: String(formData.get("clinicId") ?? ""),
    dayOfWeek: String(formData.get("dayOfWeek") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
    slotDurationMinutes: String(formData.get("slotDurationMinutes") ?? "30"),
  };

  const parsed = scheduleSchema.safeParse(values);
  if (!parsed.success) {
    return {
      message: "Please check the highlighted fields",
      fields: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  if (parsed.data.endTime <= parsed.data.startTime) {
    return {
      message: "Please check the highlighted fields",
      fields: { endTime: ["The finish time has to be after the start time"] },
      values,
    };
  }

  const { error } = await createSchedule(doctorId, {
    clinicId: parsed.data.clinicId,
    dayOfWeek: parsed.data.dayOfWeek,
    // The API stores seconds; the form only asks for hours and minutes.
    startTime: `${parsed.data.startTime}:00`,
    endTime: `${parsed.data.endTime}:00`,
    slotDurationMinutes: Number(parsed.data.slotDurationMinutes),
  });

  if (error) return { message: error, values };

  // New working hours mean new bookable slots, so booking pages are stale.
  revalidatePath(`/admin/doctors/${doctorId}/schedules`);
  revalidatePath(`/book/${doctorId}`);
  redirect(`/admin/doctors/${doctorId}/schedules?added=1`);
}
