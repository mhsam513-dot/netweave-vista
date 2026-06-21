import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Package,
  Zap,
  Radio,
  BarChart3,
  LogOut,
  Wifi,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/packages", label: "Packages", icon: Package },
  { to: "/recharge", label: "Recharge", icon: Zap },
  { to: "/towers", label: "Towers", icon: Radio },
  { to: "/reports", label: "Reports", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { signOut, user, isAdmin, roles } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [openMobile, setOpenMobile] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth", replace: true });
  };

  const SidebarBody = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-glow">
          <Wifi className="w-4.5 h-4.5 text-primary-foreground" />
        </div>
        <div>
          <div className="font-semibold text-sidebar-foreground text-sm">ME Internet</div>
          <div className="text-xs text-sidebar-foreground/60">Manager</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpenMobile(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                active
                  ? "gradient-brand text-primary-foreground shadow-glow font-medium"
                  : "text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            to="/users"
            onClick={() => setOpenMobile(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all mt-3",
              pathname.startsWith("/users")
                ? "gradient-brand text-primary-foreground shadow-glow font-medium"
                : "text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            )}
          >
            <ShieldCheck className="w-4 h-4" />
            Users & Roles
          </Link>
        )}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-2">
        <div className="px-3 py-2 rounded-lg bg-sidebar-accent/40">
          <div className="text-xs text-sidebar-foreground/60">Signed in as</div>
          <div className="text-sm text-sidebar-foreground truncate">{user?.email}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {roles.length === 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">no role</span>
            )}
            {roles.map((r) => (
              <span
                key={r}
                className="text-[10px] px-1.5 py-0.5 rounded gradient-brand text-primary-foreground capitalize"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
        <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground">
          <LogOut className="w-4 h-4 mr-2" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-sidebar border-r border-sidebar-border">
        {SidebarBody}
      </aside>

      {/* Mobile sidebar */}
      {openMobile && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpenMobile(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-sidebar border-r border-sidebar-border">
            {SidebarBody}
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-card/30">
          <button onClick={() => setOpenMobile(true)} className="p-2 rounded-md hover:bg-muted">
            {openMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center">
              <Wifi className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">ME Internet</span>
          </div>
          <div className="w-9" />
        </header>
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
