import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Flame, Copy, Printer, RefreshCw, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/hotspot")({
  component: HotspotPage,
});

const STATUSES = ["unused", "active", "expired", "revoked"] as const;

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 12 }, (_, i) => (i === 4 || i === 8 ? "-" : chars[Math.floor(Math.random() * chars.length)])).join("");
}

function HotspotPage() {
  const { isAdmin, canRecharge } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["hotspot-cards", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("hotspot_cards")
        .select("*, router:routers(name)")
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter as any);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: routers = [] } = useQuery({
    queryKey: ["routers-list"],
    queryFn: async () => (await supabase.from("routers").select("id, name").order("name")).data ?? [],
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hotspot_cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hotspot-cards"] }); toast.success("Card deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const stats = {
    total: cards.length,
    unused: cards.filter((c: any) => c.status === "unused").length,
    active: cards.filter((c: any) => c.status === "active").length,
    expired: cards.filter((c: any) => c.status === "expired").length,
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  const printCards = () => {
    const unused = cards.filter((c: any) => c.status === "unused");
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>Hotspot Cards</title>
      <style>
        body { font-family: monospace; }
        .card { display: inline-block; border: 2px dashed #666; padding: 12px 16px; margin: 8px; border-radius: 8px; width: 180px; text-align: center; }
        .code { font-size: 14px; font-weight: bold; letter-spacing: 1px; }
        .meta { font-size: 11px; color: #666; margin-top: 4px; }
      </style></head><body>
      <h2>Hotspot Access Cards</h2>
      ${unused.map((c: any) => `
        <div class="card">
          <div class="code">${c.code}</div>
          <div class="meta">${c.validity_days}d · ${c.profile ?? "Default"}</div>
          ${c.bandwidth_limit ? `<div class="meta">${c.bandwidth_limit}</div>` : ""}
        </div>
      `).join("")}
      </body></html>
    `);
    w.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("hotspot.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("hotspot.subtitle")}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(isAdmin || canRecharge) && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-brand text-primary-foreground shadow-glow">
                  <Plus className="w-4 h-4 me-1" /> {t("hotspot.generateVouchers")}
                </Button>
              </DialogTrigger>
              <GenerateCardsForm routers={routers} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["hotspot-cards"] }); }} />
            </Dialog>
          )}
          <Button variant="outline" size="sm" onClick={printCards} disabled={!stats.unused}>
            <Printer className="w-4 h-4 me-1" /> Print Unused
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Cards", value: stats.total, color: "text-blue-400 from-blue-500/20" },
          { label: "Unused", value: stats.unused, color: "text-emerald-400 from-emerald-500/20" },
          { label: "Active", value: stats.active, color: "text-violet-400 from-violet-500/20" },
          { label: "Expired", value: stats.expired, color: "text-orange-400 from-orange-500/20" },
        ].map((s) => {
          const [iconColor, gradColor] = s.color.split(" ");
          return (
            <Card key={s.label} className="gradient-card border-border/50 overflow-hidden relative">
              <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent opacity-50", gradColor)} />
              <CardContent className="p-4 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <Flame className={cn("w-4 h-4", iconColor)} />
                </div>
                <div className="text-2xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="gradient-card border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-base flex-1 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" /> Hotspot Cards
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["hotspot-cards"] })}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Profile</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Bandwidth</TableHead>
                <TableHead>Router</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Used By</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">{t("common.loading")}</TableCell></TableRow>
              )}
              {!isLoading && cards.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">{t("hotspot.empty")}</TableCell></TableRow>
              )}
              {cards.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <code className="font-mono text-sm font-bold tracking-widest">{c.code}</code>
                  </TableCell>
                  <TableCell className="text-sm">{c.profile ?? "Default"}</TableCell>
                  <TableCell className="text-sm">{c.validity_days}d</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.bandwidth_limit ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{(c.router as any)?.name ?? "—"}</TableCell>
                  <TableCell><CardStatusBadge status={c.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.used_by ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(c.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-end space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => copyCode(c.code)} title="Copy code">
                      <Copy className="w-4 h-4" />
                    </Button>
                    {isAdmin && (
                      <Button size="sm" variant="ghost" onClick={() => del.mutate(c.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
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

function CardStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    unused: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    active: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    expired: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    revoked: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  };
  return <Badge variant="outline" className={cn("text-xs capitalize", map[status] ?? "")}>{status}</Badge>;
}

function GenerateCardsForm({ routers, onDone }: { routers: any[]; onDone: () => void }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    count: "10",
    validity_days: "1",
    profile: "default",
    bandwidth_limit: "",
    router_id: "",
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const count = Math.min(Math.max(1, parseInt(form.count) || 10), 100);
    const cards = Array.from({ length: count }, () => ({
      code: generateCode(),
      validity_days: parseInt(form.validity_days) || 1,
      profile: form.profile || null,
      bandwidth_limit: form.bandwidth_limit || null,
      router_id: form.router_id || null,
    }));
    const { error } = await supabase.from("hotspot_cards").insert(cards as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${count} cards generated!`);
    onDone();
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>{t("hotspot.generateVouchers")}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Number of Cards</Label>
            <Input type="number" min={1} max={100} value={form.count} onChange={(e) => setForm({ ...form, count: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Validity (days)</Label>
            <Input type="number" min={1} value={form.validity_days} onChange={(e) => setForm({ ...form, validity_days: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Profile Name</Label>
          <Input value={form.profile} onChange={(e) => setForm({ ...form, profile: e.target.value })} placeholder="e.g. 2Mbps, Daily" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Bandwidth Limit</Label>
          <Input value={form.bandwidth_limit} onChange={(e) => setForm({ ...form, bandwidth_limit: e.target.value })} placeholder="e.g. 2M/2M" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Router (optional)</Label>
          <Select value={form.router_id} onValueChange={(v) => setForm({ ...form, router_id: v })}>
            <SelectTrigger><SelectValue placeholder={t("common.none")} /></SelectTrigger>
            <SelectContent>
              {routers.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={busy} className="gradient-brand text-primary-foreground">
            {busy ? "Generating…" : `Generate ${form.count || 10} Cards`}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
