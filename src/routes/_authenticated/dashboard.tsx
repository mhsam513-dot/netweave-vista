import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, subDays, startOfMonth, startOfDay } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const todayStart = startOfDay(new Date()).toISOString();
      const monthStart = startOfMonth(new Date()).toISOString();
      const last30 = subDays(new Date(), 29).toISOString();

      const [customers, online, todayRev, monthRev, expired, recent, chart] = await Promise.all([
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("is_online", true),
        supabase.from("recharges").select("amount").gte("created_at", todayStart),
        supabase.from("recharges").select("amount").gte("created_at", monthStart),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("status", "expired"),
        supabase
          .from("recharges")
          .select("id, amount, created_at, customer:customers(full_name, code), package:packages(name)")
          .order("created_at", { ascending: false })
          .limit(6),
        supabase.from("recharges").select("amount, created_at").gte("created_at", last30),
      ]);

      const today = (todayRev.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
      const month = (monthRev.data ?? []).reduce((s, r) => s + Number(r.amount), 0);

      const byDay: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const k = format(subDays(new Date(), i), "MMM d");
        byDay[k] = 0;
      }
      for (const r of chart.data ?? []) {
        const k = format(new Date(r.created_at), "MMM d");
        if (k in byDay) byDay[k] += Number(r.amount);
      }
      const chartData = Object.entries(byDay).map(([date, value]) => ({ date, value }));

      return {
        total: customers.count ?? 0,
        online: online.count ?? 0,
        today,
        month,
        expired: expired.count ?? 0,
        recent: recent.data ?? [],
        chartData,
      };
    },
  });

  const stats = [
    { label: "Total Customers", value: data?.total ?? 0, icon: Users, accent: "from-blue-500/20" },
    { label: "Online Now", value: data?.online ?? 0, icon: UserCheck, accent: "from-emerald-500/20" },
    { label: "Today's Revenue", value: fmtMoney(data?.today ?? 0), icon: DollarSign, accent: "from-violet-500/20" },
    { label: "Monthly Revenue", value: fmtMoney(data?.month ?? 0), icon: TrendingUp, accent: "from-fuchsia-500/20" },
    { label: "Expired Customers", value: data?.expired ?? 0, icon: AlertTriangle, accent: "from-orange-500/20" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your network and revenue.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="gradient-card border-border/50 shadow-soft overflow-hidden relative">
            <div className={`absolute inset-0 bg-gradient-to-br ${s.accent} to-transparent opacity-60 pointer-events-none`} />
            <CardContent className="p-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="mt-2 text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Revenue — last 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.chartData ?? []}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.65 0.25 290)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="oklch(0.65 0.25 290)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "oklch(0.7 0.03 280)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "oklch(0.7 0.03 280)" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.21 0.05 275)",
                      border: "1px solid oklch(1 0 0 / 0.1)",
                      borderRadius: 12,
                      color: "white",
                    }}
                  />
                  <Area type="monotone" dataKey="value" stroke="oklch(0.7 0.22 295)" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" /> Recent Recharges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.recent ?? []).length === 0 && (
              <div className="text-sm text-muted-foreground">No recharges yet.</div>
            )}
            {(data?.recent ?? []).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between gap-3 py-2 border-b border-border/40 last:border-0">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{r.customer?.full_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {r.package?.name ?? "—"} · {format(new Date(r.created_at), "MMM d, HH:mm")}
                  </div>
                </div>
                <div className="text-sm font-semibold text-gradient">{fmtMoney(r.amount)}</div>
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
