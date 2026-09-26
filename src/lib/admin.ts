import "server-only";

import { getSessionToken } from "@/lib/session";
import type { Appointment, Clinic, Service, Speciality } from "@/types";

// Everything the admin screens read and change. Every call carries the admin's
// own token, so the API decides what they may do; nothing here grants access.

export type ApiResult<T> = { data: T | null; error: string | null };

async function call<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const { body, error } = await request(path, init);
  if (error !== null) return { data: null, error };
  return { data: (body?.data ?? body) as T, error: null };
}

// The whole response body, not just `data`, for callers that also need the
// pagination block the API sends alongside it.
async function request(
  path: string,
  init?: RequestInit,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ body: any; error: string | null }> {
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
    return { body: null, error: "Could not reach the server. Please try again." };
  }

  // 204 means success with no body, which is what DELETE returns.
  if (response.status === 204) return { body: null, error: null };

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      body: null,
      error: body?.error?.message ?? "The server rejected that. Please try again.",
    };
  }

  return { body, error: null };
}

/**
 * Every item, across every page.
 *
 * The API pages its lists, 20 at a time by default, and reports
 * `pagination: { page, totalPages }`. Reading only the first response meant the
 * admin screens silently stopped at 20: with 40 users, half of them could not
 * be chosen when promoting a doctor. So this asks for large pages and keeps
 * going until the last one. Endpoints that do not paginate ignore the
 * parameters and return everything at once, which ends the loop immediately.
 */
async function list<T>(path: string): Promise<T[]> {
  const joiner = path.includes("?") ? "&" : "?";
  const items: T[] = [];

  // A ceiling, so a misbehaving pagination block can never loop for ever.
  for (let page = 1; page <= 50; page++) {
    const { body, error } = await request(`${path}${joiner}pageSize=100&page=${page}`);
    if (error !== null || !body) break;

    const data = (body.data ?? body) as T[];
    if (!Array.isArray(data)) break;
    items.push(...data);

    const totalPages = Number(body.pagination?.totalPages ?? 1);
    if (page >= totalPages || data.length === 0) break;
  }

  return items;
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

// --- Links between things ---------------------------------------------------

// These attach and detach rather than create and destroy. Unlinking a service
// from a clinic leaves the service itself alone, so every other clinic keeps
// offering it and this one can attach it again later.

export const addDoctorClinic = (doctorId: string, clinicId: string) =>
  call(`/doctors/${encodeURIComponent(doctorId)}/clinics`, {
    method: "POST",
    body: JSON.stringify({ clinicId }),
  });

// A doctor with no clinics cannot be booked, because an appointment is always
// made at one. So this is how somebody is taken out of the directory without
// destroying the appointments already booked with them.
export const removeDoctorClinic = (doctorId: string, clinicId: string) =>
  call(`/doctors/${encodeURIComponent(doctorId)}/clinics/${encodeURIComponent(clinicId)}`, {
    method: "DELETE",
  });

export const addDoctorSpeciality = (doctorId: string, specialtyId: string) =>
  call(`/doctors/${encodeURIComponent(doctorId)}/specialties`, {
    method: "POST",
    body: JSON.stringify({ specialtyId }),
  });

export const removeDoctorSpeciality = (doctorId: string, specialtyId: string) =>
  call(
    `/doctors/${encodeURIComponent(doctorId)}/specialties/${encodeURIComponent(specialtyId)}`,
    { method: "DELETE" },
  );

export const fetchClinicServices = (clinicId: string) =>
  list<Service>(`/clinics/${encodeURIComponent(clinicId)}/services`);

export const addClinicService = (clinicId: string, serviceId: string) =>
  call(`/clinics/${encodeURIComponent(clinicId)}/services`, {
    method: "POST",
    body: JSON.stringify({ serviceId }),
  });

export const removeClinicService = (clinicId: string, serviceId: string) =>
  call(`/clinics/${encodeURIComponent(clinicId)}/services/${encodeURIComponent(serviceId)}`, {
    method: "DELETE",
  });
