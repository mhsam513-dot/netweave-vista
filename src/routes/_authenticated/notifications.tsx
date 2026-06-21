import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { t } = useI18n();
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); toast.success(t("notifications.markAllRead")); },
    onError: (e: any) => toast.error(e.message),
  });

  const unread = notifications.filter((n: any) => !n.is_read).length;

  const typeIcon: Record<string, any> = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle,
    error: XCircle,
  };

  const typeColor: Record<string, string> = {
    info: "text-blue-400 bg-blue-500/10",
    warning: "text-orange-400 bg-orange-500/10",
    success: "text-emerald-400 bg-emerald-500/10",
    error: "text-red-400 bg-red-500/10",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("notifications.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("notifications.subtitle")}</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
            <CheckCheck className="w-4 h-4 me-2" /> {t("notifications.markAllRead")}
          </Button>
        )}
      </div>

      {unread > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 text-sm">
          <Bell className="w-4 h-4 text-violet-400 shrink-0" />
          <span><span className="font-semibold text-violet-300">{unread}</span> {t("notifications.unread")} notifications</span>
        </div>
      )}

      <Card className="gradient-card border-border/50">
        <CardContent className="p-0">
          {isLoading && (
            <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
          )}
          {!isLoading && notifications.length === 0 && (
            <div className="py-16 text-center">
              <Bell className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">{t("notifications.empty")}</p>
            </div>
          )}
          <div className="divide-y divide-border/40">
            {notifications.map((n: any) => {
              const Icon = typeIcon[n.type ?? "info"] ?? Info;
              const colorClass = typeColor[n.type ?? "info"] ?? typeColor.info;
              return (
                <div key={n.id} className={cn("flex items-start gap-4 p-4 transition-colors", !n.is_read && "bg-muted/10")}>
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5", colorClass)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-semibold text-sm">{n.title}</div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{format(new Date(n.created_at), "MMM d, HH:mm")}</span>
                        {!n.is_read && (
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => markRead.mutate(n.id)}>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {n.message && <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", colorClass.replace("bg-", "border-").replace("/10", "/30"))}>
                        {t(`notifications.type.${n.type ?? "info"}`)}
                      </Badge>
                      {!n.is_read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
