import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/redirects";

describe("safeNext", () => {
  it("keeps a path on this site", () => {
    expect(safeNext("/book/1")).toBe("/book/1");
    expect(safeNext("/dashboard/appointments?tab=past")).toBe("/dashboard/appointments?tab=past");
  });

  it("falls back when there is nothing to go back to", () => {
    expect(safeNext(undefined)).toBe("/dashboard");
    expect(safeNext("")).toBe("/dashboard");
    expect(safeNext(["/a", "/b"])).toBe("/dashboard");
  });

  it("refuses an absolute URL, so the site cannot be used to launder a link", () => {
    expect(safeNext("https://evil.example")).toBe("/dashboard");
    expect(safeNext("http://evil.example/login")).toBe("/dashboard");
  });

  // The one that catches people out: it starts with a slash, so a check for
  // "does it begin with /" lets it through, and the browser then reads it as a
  // protocol-relative URL and leaves the site.
  it("refuses a protocol-relative URL", () => {
    expect(safeNext("//evil.example")).toBe("/dashboard");
    expect(safeNext("//evil.example/login")).toBe("/dashboard");
  });

  // Some browsers treat a backslash as a slash, so this is the same trick.
  it("refuses backslashes", () => {
    expect(safeNext("/\\evil.example")).toBe("/dashboard");
    expect(safeNext("\\\\evil.example")).toBe("/dashboard");
  });

  it("refuses to send somebody straight back to a page that would bounce them", () => {
    expect(safeNext("/login")).toBe("/dashboard");
    expect(safeNext("/register")).toBe("/dashboard");
  });
});
