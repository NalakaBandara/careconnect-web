import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Runs before every matching request. In Next 16 this file is called proxy.ts
// (it used to be middleware.ts - most tutorials still show the old name).
//
// This is an OPTIMISTIC check only. Its job is to stop a guest ever seeing a
// protected page flash on screen. It is NOT the security boundary: pages and
// actions check again, because a matcher can be misconfigured and Server
// Actions are reachable without ever passing through here.

const COOKIE_NAME = "careconnect_session";

const NEEDS_LOGIN = ["/dashboard", "/admin", "/book", "/appointments"];
const NEEDS_ADMIN = ["/admin"];
const GUEST_ONLY = ["/login", "/register"];

type Claims = { roles?: unknown };

async function readClaims(token: string | undefined): Promise<Claims | null> {
  if (!token) return null;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload as Claims;
  } catch {
    return null; // expired or tampered with
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const claims = await readClaims(request.cookies.get(COOKIE_NAME)?.value);
  const isLoggedIn = claims !== null;
  const roles = Array.isArray(claims?.roles) ? (claims.roles as string[]) : [];

  // Signed-in users have no business on the login or register pages.
  if (isLoggedIn && GUEST_ONLY.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (NEEDS_LOGIN.some((path) => pathname.startsWith(path)) && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    // Remember where they were headed so login can send them back.
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Logged in but not an admin: this is a 403, not a login problem.
  // Redirecting to /login would imply signing in again would help. It would not.
  if (NEEDS_ADMIN.some((path) => pathname.startsWith(path)) && !roles.includes("admin")) {
    return NextResponse.redirect(new URL("/forbidden", request.url));
  }

  return NextResponse.next();
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
  matcher: ["/((?!api|_next/static|_next/image|favicon[.]ico|.*[.]).*)"],
};
