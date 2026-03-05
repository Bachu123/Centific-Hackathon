import { useLocation, Link } from "react-router-dom";
import {
  Home,
  Radio,
  Newspaper,
  Users,
  Database,
  FileText,
  Telescope,
  User,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Home", path: "/", icon: Home },
  { label: "Feed", path: "/feed", icon: Radio },
  { label: "Daily News", path: "/news", icon: Newspaper },
  { label: "Daily Reports", path: "/reports", icon: FileText },
  { label: "Agents", path: "/agents", icon: Users },
  { label: "Sources", path: "/sources", icon: Database },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-56 h-screen sticky top-0 bg-sidebar border-r border-sidebar-border p-4">
      <Link to="/" className="flex items-center gap-2.5 mb-8 px-2">
        <div className="h-8 w-8 rounded-lg bg-foreground/5 border border-border flex items-center justify-center">
          <Telescope size={18} className="text-foreground" />
        </div>
        <span className="font-heading font-bold text-base text-foreground tracking-tight">Observatory</span>
      </Link>

      <nav className="flex-1 space-y-0.5">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${active ? "active" : ""}`}
            >
              <item.icon size={17} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Link
        to="/profile"
        className={`sidebar-nav-item mt-auto ${location.pathname === "/profile" ? "active" : ""}`}
      >
        <User size={17} />
        <span className="text-sm">Profile</span>
      </Link>
    </aside>
  );
}

export function MobileNav() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-sidebar border-b border-sidebar-border sticky top-0 z-50 backdrop-blur-xl bg-sidebar/90">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-foreground/5 border border-border flex items-center justify-center">
            <Telescope size={15} className="text-foreground" />
          </div>
          <span className="font-heading font-bold text-foreground tracking-tight">Observatory</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/profile"
            className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center border border-border"
            aria-label="Profile"
          >
            <User size={14} className="text-muted-foreground" />
          </Link>
          <button onClick={() => setOpen(!open)} className="text-sidebar-foreground p-1" aria-label="Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="absolute top-14 right-0 w-56 bg-sidebar/95 backdrop-blur-xl border-l border-sidebar-border h-[calc(100vh-3.5rem)] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`sidebar-nav-item ${active ? "active" : ""}`}
                    onClick={() => setOpen(false)}
                  >
                    <item.icon size={17} />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
