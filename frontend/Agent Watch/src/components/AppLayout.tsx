import { AppSidebar, MobileNav } from "./AppSidebar";
import { NewsWidget } from "./NewsWidget";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <AppSidebar />
      <MobileNav />
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto flex gap-6 p-4 lg:p-6">
          <div className="flex-1 min-w-0">{children}</div>
          <div className="hidden xl:block w-72 shrink-0">
            <NewsWidget />
          </div>
        </div>
      </main>
    </div>
  );
}
