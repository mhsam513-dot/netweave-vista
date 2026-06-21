import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Router, Wifi, WifiOff, RefreshCw, Save, Users, Signal } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/routers/$id")({
  component: RouterDetailPage,
});

function RouterDetailPage() {
  const { id } = Route.useParams();
  const { isAdmin } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: router, isLoading } = useQuery({
    queryKey: ["router", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("routers").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    name: "",
    ip_address: "",
    model: "",
    api_port: "8728",
    username: "admin",
    password: "",
    location: "",
  });

  const startEditing = () => {
    if (router) {
      setForm({
        name: router.name ?? "",
        ip_address: router.ip_address ?? "",
        model: router.model ?? "",
        api_port: String(router.api_port ?? 8728),
        username: router.username ?? "admin",
        password: router.password ?? "",
        location: router.location ?? "",
      });
      setEditing(true);
    }
  };

  const saveRouter = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("routers").update({
        name: form.name,
        ip_address: form.ip_address || null,
        model: form.model || null,
        api_port: parseInt(form.api_port) || 8728,
        username: form.username || null,
        password: form.password || null,
        location: form.location || null,
        updated_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["router", id] });
      qc.invalidateQueries({ queryKey: ["routers"] });
      setEditing(false);
      toast.success(t("routers.updated"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  const testConnection = useMutation({
    mutationFn: async () => {
      await new Promise((r) => setTimeout(r, 1200));
      return { success: false, message: "MikroTik API connection requires a backend proxy. Please configure the API gateway." };
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Connected successfully!");
        qc.invalidateQueries({ queryKey: ["routers"] });
      } else {
        toast.info(result.message);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  if (!router) {
    return (
      <div className="space-y-4">
        <Link to="/routers" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t("routers.col.name")}
        </Link>
        <p className="text-muted-foreground">Router not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/routers" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" /> Back to Routers
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center shadow-glow">
            <Router className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{router.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {router.is_online
                ? <Badge variant="outline" className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-xs"><Wifi className="w-3 h-3 me-1" />Online</Badge>
                : <Badge variant="outline" className="bg-slate-500/15 text-slate-400 border-slate-500/30 text-xs"><WifiOff className="w-3 h-3 me-1" />Offline</Badge>
              }
              {router.model && <span className="text-sm text-muted-foreground">{router.model}</span>}
            </div>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => testConnection.mutate()} disabled={testConnection.isPending}>
              <Signal className="w-4 h-4 me-1" />
              {testConnection.isPending ? "Testing…" : t("routers.testConnection")}
            </Button>
            {!editing && (
              <Button size="sm" onClick={startEditing} className="gradient-brand text-primary-foreground">
                Edit Router
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Clients Connected", value: router.client_count ?? 0, icon: Users, color: "text-blue-400 from-blue-500/20" },
          { label: "IP Address", value: router.ip_address ?? "—", icon: Signal, color: "text-violet-400 from-violet-500/20" },
          { label: "Last Updated", value: format(new Date(router.updated_at), "MMM d, HH:mm"), icon: RefreshCw, color: "text-emerald-400 from-emerald-500/20" },
        ].map((s) => {
          const [iconColor, gradColor] = s.color.split(" ");
          return (
            <Card key={s.label} className="gradient-card border-border/50 overflow-hidden relative">
              <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent opacity-50", gradColor)} />
              <CardContent className="p-4 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <s.icon className={cn("w-4 h-4 shrink-0", iconColor)} />
                </div>
                <div className="text-lg font-bold truncate">{s.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editing ? (
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Edit Router</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">{t("routers.f.name")}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("routers.f.ip")}</Label>
              <Input value={form.ip_address} onChange={(e) => setForm({ ...form, ip_address: e.target.value })} placeholder="192.168.1.1" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("routers.f.model")}</Label>
              <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="RB750Gr3" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("routers.f.apiPort")}</Label>
              <Input type="number" value={form.api_port} onChange={(e) => setForm({ ...form, api_port: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("routers.f.location")}</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("routers.f.username")}</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("routers.f.password")}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>{t("common.cancel")}</Button>
              <Button
                onClick={() => saveRouter.mutate()}
                disabled={saveRouter.isPending}
                className="gradient-brand text-primary-foreground"
              >
                <Save className="w-4 h-4 me-1" />
                {saveRouter.isPending ? t("common.saving") : t("common.saveChanges")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="gradient-card border-border/50">
          <CardHeader><CardTitle className="text-base">Router Details</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {[
                { label: t("routers.f.name"), value: router.name },
                { label: t("routers.f.ip"), value: router.ip_address ?? "—" },
                { label: t("routers.f.model"), value: router.model ?? "—" },
                { label: t("routers.f.apiPort"), value: String(router.api_port ?? 8728) },
                { label: t("routers.f.location"), value: router.location ?? "—" },
                { label: t("routers.f.username"), value: router.username ?? "admin" },
                { label: "Added", value: format(new Date(router.created_at), "MMM d, yyyy HH:mm") },
                { label: "Updated", value: format(new Date(router.updated_at), "MMM d, yyyy HH:mm") },
              ].map((row) => (
                <div key={row.label}>
                  <dt className="text-muted-foreground text-xs">{row.label}</dt>
                  <dd className="font-medium mt-0.5">{row.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
