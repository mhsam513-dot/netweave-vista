import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfDay, startOfMonth, subDays } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line } from "recharts";
import { useI18n } from "@/lib/i18n";
import { Download, TrendingUp, DollarSign, Users, UserCheck } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { t } = useI18n();
  const [period, setPeriod] = useState("30d");

  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;

  const { data, isLoading } = useQuery({
    queryKey: ["reports", period],
    queryFn: async () => {
      const todayStart = startOfDay(new Date()).toISOString();
      const monthStart = startOfMonth(new Date()).toISOString();
      const periodStart = subDays(new Date(), days - 1).toISOString();

      const [today, month, history, statuses] = await Promise.all([
        supabase.from("recharges").select("amount").gte("created_at", todayStart),
        supabase.from("recharges").select("amount").gte("created_at", monthStart),
        supabase
          .from("recharges")
          .select("id, amount, validity_days, created_at, customer:customers(full_name, code), package:packages(name)")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("customers").select("status"),
      ]);

      const dailyMap: Record<string, number> = {};
      for (let i = days - 1; i >= 0; i--) dailyMap[format(subDays(new Date(), i), "MMM d")] = 0;
      const dailyRaw = await supabase.from("recharges").select("amount, created_at").gte("created_at", periodStart);
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

  const exportCSV = () => {
    const rows = [
      ["Date", "Customer", "Code", "Package", "Validity", "Amount"],
      ...(data?.history ?? []).map((r: any) => [
        format(new Date(r.created_at), "yyyy-MM-dd HH:mm"),
        r.customer?.full_name ?? "",
        r.customer?.code ?? "",
        r.package?.name ?? "",
        `${r.validity_days}d`,
        String(r.amount),
      ]),
    ];
    const csv = rows.map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recharges-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const kpis = [
    { label: t("dashboard.todayRevenue"), value: fmt(data?.today ?? 0), icon: DollarSign, color: "text-violet-400 from-violet-500/20" },
    { label: t("dashboard.monthlyRevenue"), value: fmt(data?.month ?? 0), icon: TrendingUp, color: "text-fuchsia-400 from-fuchsia-500/20" },
    { label: t("reports.activeCustomers"), value: data?.statusCount.active ?? 0, icon: UserCheck, color: "text-emerald-400 from-emerald-500/20" },
    { label: t("dashboard.expiredCustomers"), value: data?.statusCount.expired ?? 0, icon: Users, color: "text-orange-400 from-orange-500/20" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("reports.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("reports.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{t("reports.period.7d")}</SelectItem>
              <SelectItem value="30d">{t("reports.period.30d")}</SelectItem>
              <SelectItem value="90d">{t("reports.period.90d")}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!data?.history.length}>
            <Download className="w-4 h-4 me-1" /> {t("reports.exportCSV")}
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const [iconColor, gradColor] = k.color.split(" ");
          return (
            <Card key={k.label} className="gradient-card border-border/50 overflow-hidden relative">
              <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent opacity-50", gradColor)} />
              <CardContent className="p-4 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{k.label}</span>
                  <k.icon className={cn("w-4 h-4", iconColor)} />
                </div>
                <div className="text-2xl font-bold">{isLoading ? "—" : k.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("reports.dailyRevenue")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.daily ?? []}>
                  <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.7 0.03 280)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: "oklch(0.7 0.03 280)" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "oklch(0.21 0.05 275)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12, color: "white", fontSize: 12 }} />
                  <Bar dataKey="value" fill="oklch(0.65 0.25 295)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.daily ?? []}>
                  <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "oklch(0.7 0.03 280)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: "oklch(0.7 0.03 280)" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "oklch(0.21 0.05 275)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12, color: "white", fontSize: 12 }} />
                  <Line type="monotone" dataKey="value" stroke="oklch(0.7 0.22 295)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="gradient-card border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t("reports.recentHistory")}</CardTitle>
            <span className="text-xs text-muted-foreground">{data?.history.length ?? 0} records</span>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
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
              {isLoading && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t("common.loading")}</TableCell></TableRow>
              )}
              {(data?.history ?? []).map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy HH:mm")}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{r.customer?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{r.customer?.code}</div>
                  </TableCell>
                  <TableCell className="text-sm">{r.package?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm">{r.validity_days}d</TableCell>
                  <TableCell className="text-end font-semibold">{fmt(r.amount)}</TableCell>
                </TableRow>
              ))}
              {!isLoading && (data?.history ?? []).length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t("reports.empty")}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n));
}
