import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "./customers";

export const Route = createFileRoute("/_authenticated/customers/$id")({
  component: CustomerDetails,
});

function CustomerDetails() {
  const { id } = Route.useParams();

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

  if (!c) return <div className="text-muted-foreground">Loading…</div>;

  const info: [string, any][] = [
    ["Customer code", c.code],
    ["Phone", c.phone ?? "—"],
    ["Address", c.address ?? "—"],
    ["Service type", c.service_type],
    ["Username", c.username],
    ["Password", c.password],
    ["Package", c.package?.name ?? "—"],
    ["Tower / Sector", `${c.tower?.name ?? "—"}${c.sector?.name ? ` / ${c.sector.name}` : ""}`],
    ["Expires at", c.expires_at ? format(new Date(c.expires_at), "PPp") : "—"],
    ["Online", c.is_online ? "Yes" : "No"],
  ];

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/customers">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to customers
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
            <CardTitle className="text-base">Customer information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border/40">
              {info.map(([k, v]) => (
                <div key={k} className="py-2.5 flex items-center justify-between gap-3">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="text-sm font-medium text-right capitalize">{v}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" /> Recharge history
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(recharges ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No recharges yet.</p>
            )}
            {(recharges ?? []).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between gap-3 py-2 border-b border-border/30 last:border-0">
                <div>
                  <div className="text-sm font-medium">{r.package?.name ?? "Custom"}</div>
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
