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
  FileText,
  CreditCard,
  Router,
  Flame,
  MessageSquareWarning,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/language-switcher";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

type NavSection = {
  key: string;
  labelKey: string;
  items: NavItem[];
  adminOnly?: boolean;
};

export function AppShell({ children }: { children: ReactNode }) {
  const { signOut, user, isAdmin, roles } = useAuth();
  const { t, dir } = useI18n();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [openMobile, setOpenMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const navSections: NavSection[] = [
    {
      key: "main",
      labelKey: "nav.section.main",
      items: [
        { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
      ],
    },
    {
      key: "subscribers",
      labelKey: "nav.section.subscribers",
      items: [
        { to: "/customers", label: t("nav.customers"), icon: Users },
        { to: "/recharge", label: t("nav.recharge"), icon: Zap },
      ],
    },
    {
      key: "network",
      labelKey: "nav.section.network",
      items: [
        { to: "/packages", label: t("nav.packages"), icon: Package },
        { to: "/towers", label: t("nav.towers"), icon: Radio },
      ],
    },
    {
      key: "mikrotik",
      labelKey: "nav.section.mikrotik",
      items: [
        { to: "/routers", label: t("nav.routers"), icon: Router },
        { to: "/hotspot", label: t("nav.hotspot"), icon: Flame },
      ],
    },
    {
      key: "finance",
      labelKey: "nav.section.finance",
      items: [
        { to: "/invoices", label: t("nav.invoices"), icon: FileText },
        { to: "/payments", label: t("nav.payments"), icon: CreditCard },
      ],
    },
    {
      key: "support",
      labelKey: "nav.section.support",
      items: [
        { to: "/complaints", label: t("nav.complaints"), icon: MessageSquareWarning },
        { to: "/notifications", label: t("nav.notifications"), icon: Bell },
      ],
    },
    {
      key: "analytics",
      labelKey: "nav.section.analytics",
      items: [
        { to: "/reports", label: t("nav.reports"), icon: BarChart3 },
      ],
    },
    {
      key: "admin",
      labelKey: "nav.section.admin",
      adminOnly: true,
      items: [
        { to: "/users", label: t("nav.users"), icon: ShieldCheck, adminOnly: true },
        { to: "/settings", label: t("nav.settings"), icon: Settings, adminOnly: true },
      ],
    },
  ];

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.fromEntries(navSections.map((s) => [s.key, true]))
  );

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth", replace: true });
  };

  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-2.5 border-b border-sidebar-border transition-all duration-300",
        collapsed ? "px-3 py-4 justify-center" : "px-5 py-4"
      )}>
        <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-glow shrink-0">
          <Wifi className="w-4.5 h-4.5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sidebar-foreground text-sm truncate">{t("app.name")}</div>
            <div className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider">{t("app.tagline")}</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden lg:flex w-6 h-6 items-center justify-center rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground shrink-0 transition-colors"
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4" />
            : <ChevronDown className="w-4 h-4 rotate-90" />
          }
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 scrollbar-thin">
        {navSections.map((section) => {
          if (section.adminOnly && !isAdmin) return null;
          const visibleItems = section.items.filter((item) => !item.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.key} className="mb-1">
              {/* Section header */}
              {!collapsed && (
                <button
                  onClick={() => toggleSection(section.key)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 hover:text-sidebar-foreground/60 transition-colors"
                >
                  <span>{t(section.labelKey)}</span>
                  {openSections[section.key]
                    ? <ChevronDown className="w-3 h-3" />
                    : <ChevronRight className="w-3 h-3" />
                  }
                </button>
              )}

              {/* Section items */}
              {(collapsed || openSections[section.key]) && (
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const active = isActive(item.to);
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setOpenMobile(false)}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-lg text-sm transition-all group relative",
                          collapsed ? "px-2.5 py-2.5 justify-center" : "px-3 py-2.5",
                          active
                            ? "gradient-brand text-primary-foreground shadow-glow font-medium"
                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                        )}
                      >
                        <item.icon className={cn("shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {collapsed && (
                          <div className="absolute start-full ms-2 px-2 py-1 rounded-md bg-popover border border-border text-xs text-popover-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-lg transition-opacity">
                            {item.label}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Separator between sections */}
              {!collapsed && <div className="mx-3 my-1 border-t border-sidebar-border/30" />}
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className={cn(
        "border-t border-sidebar-border space-y-2",
        collapsed ? "p-2" : "p-3"
      )}>
        {!collapsed && (
          <div className="px-3 py-2 rounded-lg bg-sidebar-accent/40">
            <div className="text-[10px] text-sidebar-foreground/50">{t("common.signedInAs")}</div>
            <div className="text-xs text-sidebar-foreground truncate">{user?.email}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {roles.length === 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t("common.noRole")}</span>
              )}
              {roles.map((r) => (
                <span key={r} className="text-[10px] px-1.5 py-0.5 rounded gradient-brand text-primary-foreground">
                  {t(`role.${r}`)}
                </span>
              ))}
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={handleSignOut}
          title={collapsed ? t("common.signOut") : undefined}
          className={cn(
            "w-full text-sidebar-foreground/70 hover:text-sidebar-foreground",
            collapsed ? "justify-center px-2" : "justify-start"
          )}
        >
          <LogOut className={cn("w-4 h-4 shrink-0", !collapsed && "mr-2 rtl:mr-0 rtl:ml-2")} />
          {!collapsed && t("common.signOut")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background" dir={dir}>
      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:flex shrink-0 bg-sidebar border-r border-sidebar-border flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        {SidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {openMobile && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpenMobile(false)} />
          <aside className={cn(
            "absolute top-0 bottom-0 w-72 bg-sidebar border-sidebar-border flex flex-col",
            dir === "rtl" ? "right-0 border-l" : "left-0 border-r",
          )}>
            {SidebarContent}
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="flex items-center justify-between px-4 h-14 border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-30">
          <button
            onClick={() => setOpenMobile(true)}
            className="lg:hidden p-2 rounded-md hover:bg-muted text-foreground/70 hover:text-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center">
              <Wifi className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">{t("app.name")}</span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
