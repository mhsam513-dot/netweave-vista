import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Zap } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "./customers";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/customers/$id")({
  component: CustomerDetails,
});

function CustomerDetails() {
  const { id } = Route.useParams();
  const { t, dir } = useI18n();

  const { data: c } = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*, package:packages(name, price, speed), tower:towers(name), sector:sectors(name)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: recharges } = useQuery({
    queryKey: ["customer-recharges", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("recharges")
        .select("*, package:packages(name)")
        .eq("customer_id", id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (!c) return <div className="text-muted-foreground">{t("common.loading")}</div>;

  const Arrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  const info: [string, any][] = [
    [t("customers.detail.code"), c.code],
    [t("customers.f.phone"), c.phone ?? "—"],
    [t("customers.f.address"), c.address ?? "—"],
    [t("customers.f.serviceType"), t(`service.${c.service_type}`)],
    [t("customers.f.username"), c.username],
    [t("customers.f.password"), c.password],
    [t("customers.f.package"), c.package?.name ?? "—"],
    [t("customers.detail.towerSector"), `${c.tower?.name ?? "—"}${c.sector?.name ? ` / ${c.sector.name}` : ""}`],
    [t("customers.detail.expiresAt"), c.expires_at ? format(new Date(c.expires_at), "PPp") : "—"],
    [t("customers.detail.online"), c.is_online ? t("common.yes") : t("common.no")],
  ];

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/customers">
          <Arrow className="w-4 h-4 me-1" /> {t("customers.detail.back")}
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{c.full_name}</h1>
          <p className="text-muted-foreground text-sm font-mono mt-1">{c.code}</p>
        </div>
        <StatusBadge status={c.status} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base">{t("customers.detail.info")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border/40">
              {info.map(([k, v]) => (
                <div key={k} className="py-2.5 flex items-center justify-between gap-3">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="text-sm font-medium text-end">{v}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" /> {t("customers.detail.history")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(recharges ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">{t("dashboard.noRecharges")}</p>
            )}
            {(recharges ?? []).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between gap-3 py-2 border-b border-border/30 last:border-0">
                <div>
                  <div className="text-sm font-medium">{r.package?.name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(r.created_at), "MMM d, yyyy HH:mm")} · {r.validity_days}d
                  </div>
                </div>
                <div className="text-sm font-semibold text-gradient">
                  {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(r.amount))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
