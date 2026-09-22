import "server-only";

import { getSessionToken } from "@/lib/session";
import type { Appointment, Clinic, Service, Speciality } from "@/types";

// Everything the admin screens read and change. Every call carries the admin's
// own token, so the API decides what they may do; nothing here grants access.

export type ApiResult<T> = { data: T | null; error: string | null };

async function call<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const token = await getSessionToken();

  let response: Response;
  try {
    response = await fetch(`${process.env.API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch {
    return { data: null, error: "Could not reach the server. Please try again." };
  }

  // 204 means success with no body, which is what DELETE returns.
  if (response.status === 204) return { data: null, error: null };

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      data: null,
      error: body?.error?.message ?? "The server rejected that. Please try again.",
    };
  }

  return { data: (body?.data ?? body) as T, error: null };
}

async function list<T>(path: string): Promise<T[]> {
  const { data } = await call<T[]>(path);
  return data ?? [];
}

// --- Users -----------------------------------------------------------------

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  roles: string[];
}

export const fetchUsers = () => list<AdminUser>("/users");

export interface ApiRole {
  id: string;
  name: string;
  description: string | null;
}

export const fetchRoles = () => list<ApiRole>("/roles");

export const grantRole = (userId: string, roleId: string) =>
  call("/user-roles", { method: "POST", body: JSON.stringify({ userId, roleId }) });

// --- Clinics ---------------------------------------------------------------

export interface ClinicInput {
  name: string;
  addressLine1: string;
  city: string;
  telephone?: string;
  email?: string;
  description?: string;
}

export const fetchAdminClinics = () => list<Clinic>("/clinics");

export const createClinic = (input: ClinicInput) =>
  call<Clinic>("/clinics", { method: "POST", body: JSON.stringify(input) });

// PUT, not PATCH: the API replaces the record, and rejects anything missing
// name, addressLine1 or city. So the form always sends all three.
export const updateClinic = (id: string, input: ClinicInput) =>
  call<Clinic>(`/clinics/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

export const deleteClinic = (id: string) =>
  call(`/clinics/${encodeURIComponent(id)}`, { method: "DELETE" });

// --- Services --------------------------------------------------------------

export interface ServiceInput {
  name: string;
  description?: string;
  durationMinutes: number;
  status?: string;
}

export const fetchAdminServices = () => list<Service>("/services");

export const createService = (input: ServiceInput) =>
  call<Service>("/services", { method: "POST", body: JSON.stringify(input) });

export const updateService = (id: string, input: ServiceInput) =>
  call<Service>(`/services/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

// The API has no DELETE for a service. Retiring one by setting it INACTIVE is
// the better behaviour anyway: appointments already booked against it keep
// their record, which a hard delete would break.
export const retireService = (id: string, input: ServiceInput) =>
  updateService(id, { ...input, status: "INACTIVE" });

// --- Specialities ----------------------------------------------------------

export const fetchAdminSpecialities = () => list<Speciality>("/specialties");

export const createSpeciality = (input: { name: string; description?: string }) =>
  call<Speciality>("/specialties", { method: "POST", body: JSON.stringify(input) });

// --- Doctors ---------------------------------------------------------------

export interface DoctorInput {
  userId: string;
  licenseNumber: string;
  bio?: string;
  yearsOfExperience?: number;
  specialtyIds?: string[];
  clinicIds?: string[];
}

// Creating a doctor is promoting somebody who already has an account. There is
// no way to conjure one from nothing, which is why the form starts by choosing
// a registered user.
export const promoteToDoctor = (input: DoctorInput) =>
  call("/doctors", { method: "POST", body: JSON.stringify(input) });

export const updateDoctor = (
  id: string,
  input: { bio?: string; yearsOfExperience?: number; isVerified?: boolean },
) =>
  call(`/doctors/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

// --- Schedules -------------------------------------------------------------

export interface ScheduleInput {
  clinicId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

export const createSchedule = (doctorId: string, input: ScheduleInput) =>
  call(`/doctors/${encodeURIComponent(doctorId)}/schedules`, {
    method: "POST",
    body: JSON.stringify(input),
  });

// --- Appointments ----------------------------------------------------------

export const fetchAllAppointments = () => list<Appointment>("/appointments");

// Moving an appointment along the Pending, Confirmed, Completed track. In a
// larger system this is a clinic's job; here the admin does it, because the
// brief asks for three roles and this is the one that owns the data.
export const setAppointmentStatus = (id: string, status: string, reason?: string) =>
  call(`/appointments/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status, ...(reason ? { reason } : {}) }),
  });

export const checkInAppointment = (id: string, notes?: string) =>
  call(`/appointments/${encodeURIComponent(id)}/check-in`, {
    method: "POST",
    body: JSON.stringify({ status: "ARRIVED", ...(notes ? { notes } : {}) }),
  });
