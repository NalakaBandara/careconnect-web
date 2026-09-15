import Link from "next/link";
import { getSession } from "@/lib/session";
import { buttonClasses } from "@/components/Button";
import LogoutButton from "@/components/LogoutButton";
import MobileNav from "@/components/MobileNav";

// A Server Component, so it can read the session cookie directly.
// Note the trade-off: reading cookies means every page using this header is
// rendered per request rather than prebuilt. Correct behaviour is worth it here.
export default async function SiteHeader() {
  const user = await getSession();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-[1216px] items-center justify-between gap-6 px-5 py-4">
        <Link href="/" className="font-serif text-lg font-semibold">
          CareConnect
        </Link>

        <nav className="hidden items-center gap-6 text-sm lg:flex">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            Home
          </Link>
          <Link href="/about" className="text-muted-foreground hover:text-foreground">
            About
          </Link>
          {user && (
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className={buttonClasses("ghost", "sm")}>
                Log in
              </Link>
              <Link href="/register" className={buttonClasses("primary", "sm")}>
                Register
              </Link>
            </>
          )}
        </div>

        <div className="lg:hidden">
          <MobileNav isLoggedIn={Boolean(user)} />
        </div>
      </div>
    </header>
  );
}
