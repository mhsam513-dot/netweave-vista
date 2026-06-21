import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, UserCheck, DollarSign, TrendingUp, AlertTriangle, Zap,
  Package, Radio, UserX, Clock, Wifi, Plus, ArrowRight,
  MessageSquareWarning, FileText,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { format, subDays, startOfMonth, startOfDay } from "date-fns";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const PIE_COLORS = [
  "oklch(0.7 0.17 155)",
  "oklch(0.62 0.24 25)",
  "oklch(0.7 0.22 295)",
  "oklch(0.8 0.15 50)",
];

function Dashboard() {
  const { t } = useI18n();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const todayStart = startOfDay(new Date()).toISOString();
      const monthStart = startOfMonth(new Date()).toISOString();
      const last30 = subDays(new Date(), 29).toISOString();

      const [
        customers, online, todayRev, monthRev, expired, suspended, pending,
        pppoe, hotspot, packages, towers, complaints, recent, chart, chartByPkg,
        outstandingInvoices,
      ] = await Promise.all([
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("is_online", true),
        supabase.from("recharges").select("amount").gte("created_at", todayStart),
        supabase.from("recharges").select("amount").gte("created_at", monthStart),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("status", "expired"),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("status", "suspended"),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("service_type", "pppoe"),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("service_type", "hotspot"),
        supabase.from("packages").select("id", { count: "exact", head: true }),
        supabase.from("towers").select("id", { count: "exact", head: true }),
        supabase.from("complaints").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("recharges").select("id, amount, created_at, customer:customers(full_name, code), package:packages(name)").order("created_at", { ascending: false }).limit(6),
        supabase.from("recharges").select("amount, created_at").gte("created_at", last30),
        supabase.from("recharges").select("amount, package:packages(name)").gte("created_at", monthStart),
        supabase.from("invoices").select("id", { count: "exact", head: true }).eq("status", "unpaid"),
      ]);

      const today = (todayRev.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
      const month = (monthRev.data ?? []).reduce((s, r) => s + Number(r.amount), 0);

      const byDay: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) byDay[format(subDays(new Date(), i), "MMM d")] = 0;
      for (const r of chart.data ?? []) {
        const k = format(new Date(r.created_at), "MMM d");
        if (k in byDay) byDay[k] += Number(r.amount);
      }
      const chartData = Object.entries(byDay).map(([date, value]) => ({ date, value }));

      const pkgRevMap: Record<string, number> = {};
      for (const r of chartByPkg.data ?? []) {
        const name = (r.package as any)?.name ?? "Other";
        pkgRevMap[name] = (pkgRevMap[name] ?? 0) + Number(r.amount);
      }
      const packageChartData = Object.entries(pkgRevMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      const totalActive = Math.max(0, (customers.count ?? 0) - (expired.count ?? 0) - (suspended.count ?? 0) - (pending.count ?? 0));
      const statusPie = [
        { name: t("status.active"), value: totalActive },
        { name: t("status.expired"), value: expired.count ?? 0 },
        { name: t("status.suspended"), value: suspended.count ?? 0 },
        { name: t("status.pending"), value: pending.count ?? 0 },
      ].filter((d) => d.value > 0);

      return {
        total: customers.count ?? 0, online: online.count ?? 0,
        today, month,
        expired: expired.count ?? 0, suspended: suspended.count ?? 0,
        pending: pending.count ?? 0, active: totalActive,
        pppoe: pppoe.count ?? 0, hotspot: hotspot.count ?? 0,
        packages: packages.count ?? 0, towers: towers.count ?? 0,
        complaints: complaints.count ?? 0,
        outstanding: outstandingInvoices.count ?? 0,
        recent: recent.data ?? [], chartData, packageChartData, statusPie,
      };
    },
  });

  const kpis = [
    { label: t("dashboard.totalCustomers"), value: data?.total ?? 0, icon: Users, accent: "from-blue-500/20", iconColor: "text-blue-400" },
    { label: t("dashboard.onlineNow"), value: data?.online ?? 0, icon: Wifi, accent: "from-emerald-500/20", iconColor: "text-emerald-400" },
    { label: t("dashboard.activeCustomers"), value: data?.active ?? 0, icon: UserCheck, accent: "from-green-500/20", iconColor: "text-green-400" },
    { label: t("dashboard.todayRevenue"), value: fmtMoney(data?.today ?? 0), icon: DollarSign, accent: "from-violet-500/20", iconColor: "text-violet-400" },
    { label: t("dashboard.monthlyRevenue"), value: fmtMoney(data?.month ?? 0), icon: TrendingUp, accent: "from-fuchsia-500/20", iconColor: "text-fuchsia-400" },
    { label: t("dashboard.pendingInvoices"), value: data?.outstanding ?? 0, icon: FileText, accent: "from-rose-500/20", iconColor: "text-rose-400" },
    { label: t("dashboard.expiredCustomers"), value: data?.expired ?? 0, icon: AlertTriangle, accent: "from-orange-500/20", iconColor: "text-orange-400" },
    { label: t("dashboard.suspendedCustomers"), value: data?.suspended ?? 0, icon: UserX, accent: "from-red-500/20", iconColor: "text-red-400" },
    { label: t("dashboard.pendingCustomers"), value: data?.pending ?? 0, icon: Clock, accent: "from-slate-500/20", iconColor: "text-slate-400" },
    { label: t("dashboard.pppoeCustomers"), value: data?.pppoe ?? 0, icon: Zap, accent: "from-yellow-500/20", iconColor: "text-yellow-400" },
    { label: t("dashboard.hotspotCustomers"), value: data?.hotspot ?? 0, icon: Wifi, accent: "from-cyan-500/20", iconColor: "text-cyan-400" },
    { label: t("dashboard.openComplaints"), value: data?.complaints ?? 0, icon: MessageSquareWarning, accent: "from-amber-500/20", iconColor: "text-amber-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("dashboard.subtitle")}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild size="sm" className="gradient-brand text-primary-foreground shadow-glow">
            <Link to="/customers"><Plus className="w-4 h-4 me-1" /> {t("dashboard.addCustomer")}</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/recharge"><Zap className="w-4 h-4 me-1" /> {t("dashboard.newRecharge")}</Link>
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {kpis.map((s) => (
          <Card key={s.label} className={cn("gradient-card border-border/50 shadow-soft overflow-hidden relative hover:border-border transition-all duration-200", isLoading && "animate-pulse")}>
            <div className={`absolute inset-0 bg-gradient-to-br ${s.accent} to-transparent opacity-50 pointer-events-none`} />
            <CardContent className="p-3 relative">
              <div className="flex items-start justify-between gap-1 mb-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide leading-tight">{s.label}</span>
                <div className={cn("w-6 h-6 rounded-md flex items-center justify-center bg-muted/20 shrink-0", s.iconColor)}>
                  <s.icon className="w-3 h-3" />
                </div>
              </div>
              <div className="text-xl font-bold tracking-tight">{isLoading ? "—" : s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 gradient-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("dashboard.revenueChart")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.chartData ?? []}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.65 0.25 290)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="oklch(0.65 0.25 290)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.7 0.03 280)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: "oklch(0.7 0.03 280)" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "oklch(0.21 0.05 275)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12, color: "white", fontSize: 12 }} />
                  <Area type="monotone" dataKey="value" stroke="oklch(0.7 0.22 295)" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("dashboard.customerStatus")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data?.statusPie ?? []} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value">
                    {(data?.statusPie ?? []).map((_e, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "oklch(0.21 0.05 275)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1.5">
              {(data?.statusPie ?? []).map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-muted-foreground flex-1">{d.name}</span>
                  <span className="font-semibold">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("dashboard.revenueByPackage")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.packageChartData ?? []} layout="vertical" margin={{ left: 0, right: 8 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: "oklch(0.7 0.03 280)" }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "oklch(0.7 0.03 280)" }} tickLine={false} axisLine={false} width={65} />
                  <Tooltip contentStyle={{ background: "oklch(0.21 0.05 275)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" fill="oklch(0.65 0.25 295)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("dashboard.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {[
              { to: "/customers", label: t("dashboard.addCustomer"), icon: Users, color: "text-blue-400 bg-blue-500/10" },
              { to: "/recharge", label: t("dashboard.newRecharge"), icon: Zap, color: "text-violet-400 bg-violet-500/10" },
              { to: "/reports", label: t("dashboard.viewReports"), icon: TrendingUp, color: "text-emerald-400 bg-emerald-500/10" },
              { to: "/invoices", label: t("nav.invoices"), icon: FileText, color: "text-fuchsia-400 bg-fuchsia-500/10" },
              { to: "/complaints", label: t("nav.complaints"), icon: MessageSquareWarning, color: "text-orange-400 bg-orange-500/10" },
            ].map((action) => (
              <Link key={action.to} to={action.to} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/10 transition-colors group">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", action.color)}>
                  <action.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium flex-1">{action.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" /> {t("dashboard.recentRecharges")}
              </CardTitle>
              <Link to="/reports" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                {t("common.view")} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.recent ?? []).length === 0 && (
              <div className="text-sm text-muted-foreground py-4 text-center">{t("dashboard.noRecharges")}</div>
            )}
            {(data?.recent ?? []).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-border/30 last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">{r.customer?.full_name ?? "—"}</div>
                  <div className="text-[10px] text-muted-foreground">{r.package?.name ?? "—"} · {format(new Date(r.created_at), "MMM d, HH:mm")}</div>
                </div>
                <div className="text-xs font-bold text-gradient shrink-0">{fmtMoney(r.amount)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
