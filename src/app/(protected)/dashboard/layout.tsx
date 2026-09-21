import DashboardNav from "@/components/dashboard/DashboardNav";
import { getSession, isAdmin } from "@/lib/session";

// The shell every dashboard page sits inside. A layout does not re-render when
// you move between its children, so the sidebar is rendered once and stays put
// as you navigate - including its scroll position.
export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  // Safe to read here: (protected)/layout.tsx above has already redirected
  // anyone without a session.
  const user = await getSession();

  return (
    <div className="container-page py-10">
      <div className="grid gap-8 lg:grid-cols-[13rem_1fr] lg:gap-12">
        {/* On a narrow screen the sidebar becomes a scrollable row of tabs
            above the content rather than disappearing. */}
        <aside className="border-b border-border pb-4 lg:border-b-0 lg:pb-0">
          <DashboardNav isAdmin={isAdmin(user)} />
        </aside>

        {/* A landmark, so assistive technology can skip the sidebar. */}
        <main id="main" className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
