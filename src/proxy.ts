import { NextResponse, type NextRequest } from "next/server";
import { decodeJwt, jwtVerify } from "jose";

import { isAdminRole } from "@/lib/roles";

// Runs before every matching request. In Next 16 this file is called proxy.ts
// (it used to be middleware.ts - most tutorials still show the old name).
//
// This is an OPTIMISTIC check only. Its job is to stop a guest ever seeing a
// protected page flash on screen. It is NOT the security boundary: pages and
// actions check again, because a matcher can be misconfigured and Server
// Actions are reachable without ever passing through here.

const COOKIE_NAME = "careconnect_session";

const NEEDS_LOGIN = ["/dashboard", "/admin", "/book"];
const NEEDS_ADMIN = ["/admin"];
const GUEST_ONLY = ["/login", "/register"];

type Claims = { roles?: unknown };

// Same rule as src/lib/session.ts: the API signs the token, so the signature
// can only be checked if that secret is shared with us. Either way this file
// is optimistic by design - the pages behind it check again, and the API is
// the thing that actually refuses forged tokens.
async function readClaims(token: string | undefined): Promise<Claims | null> {
  if (!token) return null;

  const apiSecret = process.env.API_JWT_SECRET;

  if (apiSecret) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(apiSecret));
      return payload as Claims;
    } catch {
      return null; // expired or tampered with
    }
  }

  try {
    const payload = decodeJwt(token);
    if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) return null;
    return payload as Claims;
  } catch {
    return null;
  }
}

/**
 * A Content Security Policy, built per request because it carries a nonce.
 *
 * The nonce is a random value that only this response knows. Next puts it on
 * its own framework and page scripts automatically, so a script the browser was
 * tricked into loading has no matching nonce and never runs. That is the whole
 * point: this app has no dangerouslySetInnerHTML anywhere, but a CSP is what
 * limits the damage if one is ever added.
 *
 * `strict-dynamic` lets a script that already passed the nonce check load
 * further scripts, which is how Next's chunk loading works.
 *
 * style-src keeps 'unsafe-inline'. Two components set a style attribute with a
 * value that changes at runtime, the parallax transform and the filter's
 * pending opacity, and a nonce cannot apply to an attribute. Inline styles are
 * also a far weaker vector than inline scripts: without innerHTML there is no
 * way to inject one.
 *
 * connect-src is 'self' only. The CareConnect API is called from the server, so
 * the browser never talks to it directly and has no business being allowed to.
 */
function contentSecurityPolicy(nonce: string): string {
  // React uses eval in development to rebuild server error stacks. It does not
  // in production, so the allowance is scoped to dev only.
  const isDev = process.env.NODE_ENV === "development";

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // crypto.randomUUID is available on the Web Crypto global, so this needs no
  // Node import and works whatever runtime the proxy is given.
  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce);

  // Next reads the nonce back out of the request's CSP header while rendering,
  // and attaches it to its own scripts. So it has to be set on the REQUEST as
  // well as the response, not just the response.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  // Every branch below returns through this, so there is no path out of the
  // proxy that forgets the policy.
  const withCsp = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", csp);
    return response;
  };

  const claims = await readClaims(request.cookies.get(COOKIE_NAME)?.value);
  const isLoggedIn = claims !== null;
  const roles = Array.isArray(claims?.roles) ? (claims.roles as string[]) : [];

  // Signed-in users have no business on the login or register pages.
  if (isLoggedIn && GUEST_ONLY.some((path) => pathname.startsWith(path))) {
    return withCsp(NextResponse.redirect(new URL("/dashboard", request.url)));
  }

  if (NEEDS_LOGIN.some((path) => pathname.startsWith(path)) && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    // Remember where they were headed so login can send them back. Only the
    // path, never a full URL: see safeNext() in lib/redirects.ts, which is what
    // reads this back and refuses anything pointing off-site.
    loginUrl.searchParams.set("next", pathname);
    return withCsp(NextResponse.redirect(loginUrl));
  }

  // Logged in but not an admin: this is a 403, not a login problem.
  // Redirecting to /login would imply signing in again would help. It would not.
  if (NEEDS_ADMIN.some((path) => pathname.startsWith(path)) && !isAdminRole(roles)) {
    return withCsp(NextResponse.redirect(new URL("/forbidden", request.url)));
  }

  return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  // Without a matcher this would run on every image and font too, adding
  // latency to every single asset request.
  //
  // The dots are written [.] rather than \. on purpose. This is a JavaScript
  // STRING, so a single backslash is eaten before the regex engine ever sees
  // it: "\." becomes "." - "any character". That turned the last alternative
  // into "any path of one or more characters", so the negative lookahead
  // rejected every route except "/" and silently disabled this whole file.
  // A character class needs no escaping, so it cannot be broken that way.
  // A prefetch from next/link is not a navigation, so it needs neither a
  // policy nor a redirect. Excluding it also stops a prefetch of a protected
  // page being answered with a redirect the user never asked for.
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon[.]ico|.*[.]).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
