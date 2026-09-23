import path from "node:path";

// Where the setup project saves the signed-in sessions, and where every other
// test reads them from.
//
// These live in their own module, not in auth.setup.ts, because Playwright
// refuses to let one test file import another: it would end up collecting the
// setup's tests twice.
export const PATIENT_STATE = path.join(__dirname, "../../playwright/.auth/patient.json");
export const ADMIN_STATE = path.join(__dirname, "../../playwright/.auth/admin.json");
