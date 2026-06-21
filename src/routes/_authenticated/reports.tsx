import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, startOfDay, startOfMonth, subDays } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { t } = useI18n();
  const { data } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const todayStart = startOfDay(new Date()).toISOString();
      const monthStart = startOfMonth(new Date()).toISOString();
      const last30 = subDays(new Date(), 29).toISOString();

      const [today, month, history, statuses] = await Promise.all([
        supabase.from("recharges").select("amount").gte("created_at", todayStart),
        supabase.from("recharges").select("amount").gte("created_at", monthStart),
        supabase
          .from("recharges")
          .select("id, amount, validity_days, created_at, customer:customers(full_name, code), package:packages(name)")
          .order("created_at", { ascending: false })
          .limit(30),
        supabase.from("customers").select("status"),
      ]);

      const dailyMap: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) dailyMap[format(subDays(new Date(), i), "MMM d")] = 0;
      const dailyRaw = await supabase.from("recharges").select("amount, created_at").gte("created_at", last30);
      for (const r of dailyRaw.data ?? []) {
        const k = format(new Date(r.created_at), "MMM d");
        if (k in dailyMap) dailyMap[k] += Number(r.amount);
      }

      const statusCount: Record<string, number> = { active: 0, suspended: 0, expired: 0, pending: 0 };
      for (const c of statuses.data ?? []) statusCount[c.status] = (statusCount[c.status] ?? 0) + 1;

      return {
        today: (today.data ?? []).reduce((s, r) => s + Number(r.amount), 0),
        month: (month.data ?? []).reduce((s, r) => s + Number(r.amount), 0),
        history: history.data ?? [],
        daily: Object.entries(dailyMap).map(([date, value]) => ({ date, value })),
        statusCount,
      };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("reports.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("reports.subtitle")}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label={t("dashboard.todayRevenue")} value={fmt(data?.today ?? 0)} />
        <KPI label={t("dashboard.monthlyRevenue")} value={fmt(data?.month ?? 0)} />
        <KPI label={t("reports.activeCustomers")} value={data?.statusCount.active ?? 0} />
        <KPI label={t("dashboard.expiredCustomers")} value={data?.statusCount.expired ?? 0} />
      </div>

      <Card className="gradient-card border-border/50">
        <CardHeader><CardTitle className="text-base">{t("reports.dailyRevenue")}</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.daily ?? []}>
                <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "oklch(0.7 0.03 280)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "oklch(0.7 0.03 280)" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "oklch(0.21 0.05 275)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12, color: "white" }} />
                <Bar dataKey="value" fill="oklch(0.65 0.25 295)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="gradient-card border-border/50">
        <CardHeader><CardTitle className="text-base">{t("reports.recentHistory")}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("reports.col.date")}</TableHead>
                <TableHead>{t("reports.col.customer")}</TableHead>
                <TableHead>{t("reports.col.package")}</TableHead>
                <TableHead>{t("reports.col.validity")}</TableHead>
                <TableHead className="text-end">{t("reports.col.amount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.history ?? []).map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy HH:mm")}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{r.customer?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{r.customer?.code}</div>
                  </TableCell>
                  <TableCell>{r.package?.name ?? "—"}</TableCell>
                  <TableCell>{r.validity_days}d</TableCell>
                  <TableCell className="text-end font-semibold">{fmt(r.amount)}</TableCell>
                </TableRow>
              ))}
              {(data?.history ?? []).length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t("reports.empty")}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: any }) {
  return (
    <Card className="gradient-card border-border/50">
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
function fmt(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n));
}
