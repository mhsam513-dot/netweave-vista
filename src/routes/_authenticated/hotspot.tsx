import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Flame, Wifi, Users, Activity } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/hotspot")({
  component: HotspotPage,
});

function HotspotPage() {
  const { t } = useI18n();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["hotspot-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*, package:packages(name), tower:towers(name)")
        .eq("service_type", "hotspot")
        .order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const online = sessions.filter((s: any) => s.is_online).length;
  const active = sessions.filter((s: any) => s.status === "active").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("hotspot.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("hotspot.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Hotspot Users", value: sessions.length, icon: Users, color: "text-blue-400 from-blue-500/20" },
          { label: t("hotspot.activeSessions"), value: online, icon: Flame, color: "text-orange-400 from-orange-500/20" },
          { label: "Active Subscribers", value: active, icon: Wifi, color: "text-emerald-400 from-emerald-500/20" },
          { label: "Offline", value: sessions.length - online, icon: Activity, color: "text-slate-400 from-slate-500/20" },
        ].map((s) => (
          <Card key={s.label} className="gradient-card border-border/50 overflow-hidden relative">
            <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent opacity-50", s.color.split(" ")[1])} />
            <CardContent className="p-4 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className={cn("w-4 h-4", s.color.split(" ")[0])} />
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="gradient-card border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" /> Hotspot Subscribers
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Tower</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Online</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{t("common.loading")}</TableCell></TableRow>
              )}
              {!isLoading && sessions.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{t("hotspot.empty")}</TableCell></TableRow>
              )}
              {sessions.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.full_name}</TableCell>
                  <TableCell className="font-mono text-xs">{s.username ?? "—"}</TableCell>
                  <TableCell className="text-sm">{(s.package as any)?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{(s.tower as any)?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      s.status === "active" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" :
                      s.status === "suspended" ? "bg-orange-500/15 text-orange-300 border-orange-500/30" :
                      "bg-rose-500/15 text-rose-300 border-rose-500/30"
                    }>
                      {t(`status.${s.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {s.is_online
                      ? <span className="flex items-center gap-1 text-xs text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Online</span>
                      : <span className="flex items-center gap-1 text-xs text-muted-foreground"><span className="w-1.5 h-1.5 rounded-full bg-muted" />Offline</span>
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
