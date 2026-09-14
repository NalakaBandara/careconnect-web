// Shared shell for the auth pages. The folder name is in brackets, which makes
// it a "route group": it organises files without appearing in the URL.
// So this wraps /login and /register, not /auth/login.

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 items-center justify-center bg-surface px-5 py-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
