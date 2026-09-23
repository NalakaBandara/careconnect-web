/**
 * Where a user should be sent after signing in.
 *
 * proxy.ts puts the path they were trying to reach in ?next=, so logging in
 * takes them there rather than dumping them on the dashboard. That value comes
 * from the URL bar, so it is attacker-controlled and cannot be used as given.
 *
 * The attack it prevents is an open redirect: a link to
 *
 *   https://careconnect.example/login?next=https://evil.example/login
 *
 * looks like the real site, and is, right up to the moment the user signs in
 * and is handed to a copy of the login page that keeps their password. The
 * padlock and the domain both looked right the whole way.
 *
 * So only a path on this site is allowed through, and anything else quietly
 * becomes the dashboard.
 */
export function safeNext(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string" || value.length === 0) return fallback;

  // Must be a path on this site. "//evil.example" is the one that catches
  // people out: it starts with a slash, so a naive check passes it, but a
  // browser reads it as a protocol-relative URL and leaves the site.
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;

  // A backslash is treated as a slash by some browsers, so "/\evil.example"
  // is the same trick wearing a different hat.
  if (value.includes("\\")) return fallback;

  // No sending somebody back to a page that would immediately bounce them out
  // again, which would look like the login had failed.
  if (value.startsWith("/login") || value.startsWith("/register")) return fallback;

  return value;
}
