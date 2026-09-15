// Shared shell for the auth pages. The folder name is in brackets, which makes
// it a "route group": it organises files without appearing in the URL.
// So this wraps /login and /register, not /auth/login.

// <main> is a landmark: assistive technology can jump straight to it
// instead of tabbing through the header on every page.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main id="main" className="flex flex-1 items-center justify-center bg-surface px-5 py-12">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
