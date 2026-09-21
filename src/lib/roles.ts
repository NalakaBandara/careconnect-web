// The role names the CareConnect API uses. They are uppercase, and there are
// five of them, so they live in one place rather than as loose strings
// scattered through the app: a typo in a string is silent, a typo in a
// constant is a compile error.
export const ROLE = {
  PATIENT: "PATIENT",
  DOCTOR: "DOCTOR",
  CLINIC_ADMIN: "CLINIC_ADMIN",
  STAFF: "STAFF",
  ADMIN: "ADMIN",
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

// Everyone who registers is a PATIENT. There is no way to sign yourself up as
// a doctor or an admin; an existing admin has to promote you.
export const DEFAULT_ROLE: Role = ROLE.PATIENT;

// Who may reach the admin area. CLINIC_ADMIN manages a single clinic and STAFF
// works its front desk, so neither belongs in the site-wide admin screens.
export const ADMIN_ROLES: readonly Role[] = [ROLE.ADMIN];

export function isAdminRole(roles: readonly string[]): boolean {
  return roles.some((role) => ADMIN_ROLES.includes(role as Role));
}
