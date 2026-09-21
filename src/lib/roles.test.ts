import { describe, it, expect } from "vitest";

import { isAdminRole, ROLE } from "@/lib/roles";

// Small function, but it is the one that decides who reaches the admin area,
// so it is worth pinning down exactly.
describe("isAdminRole", () => {
  it("lets ADMIN through", () => {
    expect(isAdminRole([ROLE.ADMIN])).toBe(true);
    expect(isAdminRole([ROLE.PATIENT, ROLE.ADMIN])).toBe(true);
  });

  it("keeps CLINIC_ADMIN and STAFF out", () => {
    // Both manage a single clinic. Neither runs the whole site, and the name
    // CLINIC_ADMIN containing "admin" is exactly the trap this guards against.
    expect(isAdminRole([ROLE.CLINIC_ADMIN])).toBe(false);
    expect(isAdminRole([ROLE.STAFF])).toBe(false);
    expect(isAdminRole([ROLE.CLINIC_ADMIN, ROLE.STAFF, ROLE.DOCTOR])).toBe(false);
  });

  it("keeps out patients, doctors and the roleless", () => {
    expect(isAdminRole([ROLE.PATIENT])).toBe(false);
    expect(isAdminRole([ROLE.DOCTOR])).toBe(false);
    expect(isAdminRole([])).toBe(false);
  });

  it("is case sensitive, matching the API exactly", () => {
    expect(isAdminRole(["admin"])).toBe(false);
    expect(isAdminRole(["Admin"])).toBe(false);
  });
});
