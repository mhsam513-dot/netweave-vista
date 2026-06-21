import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Router, Pencil, Trash2, Wifi, WifiOff, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/routers")({
  component: RoutersPage,
});

function RoutersPage() {
  const { isAdmin } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: routers = [], isLoading } = useQuery({
    queryKey: ["routers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routers")
        .select("id, name, ip_address, api_port, model, username, location, is_online, client_count, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("routers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["routers"] }); toast.success(t("routers.deleted")); },
    onError: (e: any) => toast.error(e.message),
  });

  const online = routers.filter((r: any) => r.is_online).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("routers.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("routers.subtitle")}</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button className="gradient-brand text-primary-foreground shadow-glow">
                <Plus className="w-4 h-4 me-1" /> {t("routers.new")}
              </Button>
            </DialogTrigger>
            <RouterForm key={editing?.id ?? "new"} editing={editing} onDone={() => { setOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: ["routers"] }); }} />
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label={t("routers.totalRouters")} value={routers.length} icon={Router} color="text-violet-400 from-violet-500/20" />
        <StatCard label={t("routers.onlineRouters")} value={online} icon={Wifi} color="text-emerald-400 from-emerald-500/20" />
        <StatCard label={t("status.offline")} value={routers.length - online} icon={WifiOff} color="text-red-400 from-red-500/20" />
        <StatCard label="Total Clients" value={routers.reduce((s: number, r: any) => s + (r.client_count ?? 0), 0)} icon={Router} color="text-blue-400 from-blue-500/20" />
      </div>

      <Card className="gradient-card border-border/50">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("routers.col.name")}</TableHead>
                <TableHead>{t("routers.col.ip")}</TableHead>
                <TableHead>{t("routers.col.model")}</TableHead>
                <TableHead>{t("routers.col.location")}</TableHead>
                <TableHead>{t("routers.col.status")}</TableHead>
                {isAdmin && <TableHead className="text-end">{t("common.actions")}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{t("common.loading")}</TableCell></TableRow>
              )}
              {!isLoading && routers.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{t("routers.empty")}</TableCell></TableRow>
              )}
              {routers.map((r: any) => (
                <TableRow key={r.id} className="group">
                  <TableCell>
                    <Link
                      to="/routers/$id"
                      params={{ id: r.id }}
                      className="flex items-center gap-2 font-semibold hover:text-accent transition-colors group-hover:underline"
                    >
                      <Router className="w-4 h-4 text-violet-400 shrink-0" />
                      {r.name}
                      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.ip_address ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.model ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.location ?? "—"}</TableCell>
                  <TableCell>
                    {r.is_online
                      ? <Badge variant="outline" className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-xs"><Wifi className="w-3 h-3 me-1" />{t("routers.connected")}</Badge>
                      : <Badge variant="outline" className="bg-slate-500/15 text-slate-400 border-slate-500/30 text-xs"><WifiOff className="w-3 h-3 me-1" />{t("routers.disconnected")}</Badge>
                    }
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-end space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => del.mutate(r.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  const [iconColor, gradColor] = color.split(" ");
  return (
    <Card className="gradient-card border-border/50 overflow-hidden relative">
      <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent opacity-50", gradColor)} />
      <CardContent className="p-4 relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className={cn("w-4 h-4", iconColor)} />
        </div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function RouterForm({ editing, onDone }: { editing: any; onDone: () => void }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    ip_address: editing?.ip_address ?? "",
    model: editing?.model ?? "",
    type: editing?.type ?? "mikrotik",
    api_port: editing?.api_port ?? "8728",
    username: editing?.username ?? "admin",
    password: "", // write-only — never prefill from DB; leave blank to keep existing value
    location: editing?.location ?? "",
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { password, ...rest } = form;
    const base = { ...rest, api_port: Number(form.api_port) || 8728, type: form.type || "mikrotik" };

    let routerId = editing?.id;
    if (editing) {
      const res = await supabase.from("routers").update(base).eq("id", editing.id);
      if (res.error) { setBusy(false); return toast.error(res.error.message); }
    } else {
      const res = await supabase.from("routers").insert(base).select("id").single();
      if (res.error) { setBusy(false); return toast.error(res.error.message); }
      routerId = res.data?.id;
    }

    if (password && routerId) {
      const { error: secErr } = await supabase.from("router_secrets").upsert(
        { router_id: routerId, password, updated_at: new Date().toISOString() },
        { onConflict: "router_id" }
      );
      if (secErr) { setBusy(false); return toast.error(secErr.message); }
    }

    setBusy(false);
    toast.success(editing ? t("routers.updated") : t("routers.created"));
    onDone();
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>{editing ? t("routers.col.name") : t("routers.new")}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label className="text-xs">{t("routers.f.name")}</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("routers.f.ip")}</Label>
          <Input value={form.ip_address} onChange={(e) => setForm({ ...form, ip_address: e.target.value })} placeholder="192.168.1.1" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("routers.f.apiPort")}</Label>
          <Input type="number" value={form.api_port} onChange={(e) => setForm({ ...form, api_port: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("routers.f.username")}</Label>
          <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("routers.f.password")}</Label>
          <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("routers.f.model")}</Label>
          <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="RB750Gr3" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Router Type</Label>
          <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="mikrotik">MikroTik</option>
            <option value="ubiquiti">Ubiquiti</option>
            <option value="cisco">Cisco</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("routers.f.location")}</Label>
          <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </div>
        <DialogFooter className="col-span-2">
          <Button type="submit" disabled={busy} className="gradient-brand text-primary-foreground">
            {busy ? t("common.saving") : editing ? t("common.saveChanges") : t("common.create")}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
