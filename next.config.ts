import type { NextConfig } from "next";
import path from "path";

// Response headers that do not depend on the request. The Content-Security
// Policy is NOT here: it carries a per-request nonce, so it is built in
// proxy.ts where a nonce can be generated.
//
// Sent on every response, including static assets, which is why these live in
// the config rather than in the proxy.
const securityHeaders = [
  // Stops the browser guessing a file's type from its contents. Without it an
  // upload that looks like HTML can be served as HTML and run as a page.
  { key: "X-Content-Type-Options", value: "nosniff" },

  // No other site may frame this one, so a clickjacking overlay cannot sit an
  // invisible copy of the booking form over somebody else's page. CSP's
  // frame-ancestors says the same thing; this is the older header, still
  // honoured by browsers that ignore that directive.
  { key: "X-Frame-Options", value: "DENY" },

  // Send the full URL only to ourselves. A referrer leaving this site would
  // otherwise carry paths like /dashboard/appointments/CC-4821-MEH, which is a
  // booking reference handed to a third party.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Nothing here uses a camera, microphone or location, so nothing is allowed
  // to ask. An empty list is a denial, not an omission.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

// Only over HTTPS, and only in production: sending it from http://localhost
// would pin the browser to HTTPS for localhost and break every other local
// project on port 3000.
const productionOnlyHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(import.meta.dirname),
  },
  // Makes <Link href> and router.push() accept only routes that actually
  // exist. Without it a typo like "/servces" compiles happily and becomes a
  // 404 somebody finds later.
  typedRoutes: true,

  async headers() {
    return [
      {
        source: "/:path*",
        headers:
          process.env.NODE_ENV === "production"
            ? [...securityHeaders, ...productionOnlyHeaders]
            : securityHeaders,
      },
    ];
  },
};

export default nextConfig;
