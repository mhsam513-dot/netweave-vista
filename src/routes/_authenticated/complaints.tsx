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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, MessageSquareWarning, CheckCircle, Pencil, AlertTriangle, Clock, CheckCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/complaints")({
  component: ComplaintsPage,
});

const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES = ["open", "inProgress", "resolved", "closed"];

function ComplaintsPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ["complaints", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("complaints")
        .select("*, customer:customers(full_name, code)")
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter as "open" | "inProgress" | "resolved" | "closed");
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-list"],
    queryFn: async () => (await supabase.from("customers").select("id, full_name, code").order("full_name")).data ?? [],
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "open" | "inProgress" | "resolved" | "closed" }) => {
      const { error } = await supabase.from("complaints").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["complaints"] }); toast.success(t("complaints.updated")); },
    onError: (e: any) => toast.error(e.message),
  });

  const totals = {
    open: complaints.filter((c: any) => c.status === "open").length,
    inProgress: complaints.filter((c: any) => c.status === "inProgress").length,
    resolved: complaints.filter((c: any) => c.status === "resolved").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("complaints.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("complaints.subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button className="gradient-brand text-primary-foreground shadow-glow">
              <Plus className="w-4 h-4 me-1" /> {t("complaints.new")}
            </Button>
          </DialogTrigger>
          <ComplaintForm key={editing?.id ?? "new"} editing={editing} customers={customers} onDone={() => { setOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: ["complaints"] }); }} />
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t("complaints.totalOpen"), value: totals.open, icon: AlertTriangle, color: "text-orange-400 from-orange-500/20" },
          { label: t("complaints.totalInProgress"), value: totals.inProgress, icon: Clock, color: "text-blue-400 from-blue-500/20" },
          { label: t("complaints.totalResolved"), value: totals.resolved, icon: CheckCheck, color: "text-emerald-400 from-emerald-500/20" },
          { label: "Total", value: complaints.length, icon: MessageSquareWarning, color: "text-violet-400 from-violet-500/20" },
        ].map((s) => {
          const [iconColor, gradColor] = s.color.split(" ");
          return (
            <Card key={s.label} className="gradient-card border-border/50 overflow-hidden relative">
              <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent opacity-50", gradColor)} />
              <CardContent className="p-4 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <s.icon className={cn("w-4 h-4", iconColor)} />
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
            <CardTitle className="text-base flex-1">{t("complaints.title")}</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("status.all")}</SelectItem>
                <SelectItem value="open">{t("complaints.status.open")}</SelectItem>
                <SelectItem value="inProgress">{t("complaints.status.inProgress")}</SelectItem>
                <SelectItem value="resolved">{t("complaints.status.resolved")}</SelectItem>
                <SelectItem value="closed">{t("complaints.status.closed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("complaints.col.id")}</TableHead>
                <TableHead>{t("complaints.col.customer")}</TableHead>
                <TableHead>{t("complaints.col.subject")}</TableHead>
                <TableHead>{t("complaints.col.priority")}</TableHead>
                <TableHead>{t("complaints.col.status")}</TableHead>
                <TableHead>{t("complaints.col.created")}</TableHead>
                <TableHead className="text-end">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">{t("common.loading")}</TableCell></TableRow>
              )}
              {!isLoading && complaints.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">{t("complaints.empty")}</TableCell></TableRow>
              )}
              {complaints.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs font-semibold">#{c.id.slice(0, 6).toUpperCase()}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{c.customer?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{c.customer?.code}</div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="text-sm font-medium truncate">{c.subject}</div>
                    {c.description && <div className="text-xs text-muted-foreground truncate">{c.description}</div>}
                  </TableCell>
                  <TableCell><PriorityBadge priority={c.priority} /></TableCell>
                  <TableCell><ComplaintStatusBadge status={c.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(c.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-end space-x-1">
                    {c.status === "open" && (
                      <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: c.id, status: "inProgress" })}>
                        <Clock className="w-4 h-4 text-blue-400" />
                      </Button>
                    )}
                    {(c.status === "open" || c.status === "inProgress") && (
                      <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: c.id, status: "resolved" })}>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
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

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    low: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    medium: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    high: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    urgent: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  };
  const { t } = useI18n();
  return <Badge variant="outline" className={cn("text-xs", map[priority] ?? "")}>{t(`complaints.priority.${priority}`)}</Badge>;
}

function ComplaintStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    inProgress: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    resolved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    closed: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  };
  const { t } = useI18n();
  return <Badge variant="outline" className={cn("text-xs", map[status] ?? "")}>{t(`complaints.status.${status}`)}</Badge>;
}

function ComplaintForm({ editing, customers, onDone }: { editing: any; customers: any[]; onDone: () => void }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    customer_id: editing?.customer_id ?? "",
    subject: editing?.subject ?? "",
    description: editing?.description ?? "",
    priority: editing?.priority ?? "medium",
    status: editing?.status ?? "open",
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload = { ...form, customer_id: form.customer_id || null };
    const res = editing
      ? await supabase.from("complaints").update(payload).eq("id", editing.id)
      : await supabase.from("complaints").insert(payload);
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(editing ? t("complaints.updated") : t("complaints.created"));
    onDone();
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>{editing ? t("common.edit") : t("complaints.new")}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="grid gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">{t("complaints.f.customer")}</Label>
          <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
            <SelectTrigger><SelectValue placeholder={t("common.none")} /></SelectTrigger>
            <SelectContent>
              {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name} — {c.code}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("complaints.f.subject")}</Label>
          <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("complaints.f.description")}</Label>
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("complaints.f.priority")}</Label>
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{t(`complaints.priority.${p}`)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("common.status")}</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`complaints.status.${s}`)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={busy} className="gradient-brand text-primary-foreground">
            {busy ? t("common.saving") : editing ? t("common.saveChanges") : t("common.submit")}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
