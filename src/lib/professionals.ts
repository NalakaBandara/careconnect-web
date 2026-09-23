import "server-only";

// The directory comes from the real API. This file stays as the import everyone
// already uses, so the move did not touch a dozen call sites.
export { fetchProfessional, fetchProfessionals } from "@/lib/directory";
