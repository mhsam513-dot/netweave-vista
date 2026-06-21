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
import { Plus, FileText, CheckCircle, Trash2, DollarSign, AlertTriangle, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/invoices")({
  component: InvoicesPage,
});

function InvoicesPage() {
  const { isAdmin } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("invoices")
        .select("*, customer:customers(full_name, code)")
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter as "unpaid" | "paid" | "overdue");
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-list"],
    queryFn: async () => (await supabase.from("customers").select("id, full_name, code").order("full_name")).data ?? [],
  });

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoices"] }); toast.success(t("invoices.updated")); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invoices"] }); toast.success(t("invoices.deleted")); },
    onError: (e: any) => toast.error(e.message),
  });

  const totals = {
    total: invoices.length,
    paid: invoices.filter((i: any) => i.status === "paid").length,
    unpaid: invoices.filter((i: any) => i.status === "unpaid").length,
    overdue: invoices.filter((i: any) => i.status === "overdue").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("invoices.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("invoices.subtitle")}</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-brand text-primary-foreground shadow-glow">
                <Plus className="w-4 h-4 me-1" /> {t("invoices.new")}
              </Button>
            </DialogTrigger>
            <InvoiceForm customers={customers} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["invoices"] }); }} />
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label={t("invoices.total")} value={totals.total} icon={FileText} color="text-blue-400 from-blue-500/20" />
        <StatCard label={t("invoices.totalPaid")} value={totals.paid} icon={CheckCircle} color="text-emerald-400 from-emerald-500/20" />
        <StatCard label={t("invoices.totalUnpaid")} value={totals.unpaid} icon={Clock} color="text-orange-400 from-orange-500/20" />
        <StatCard label={t("invoices.totalOverdue")} value={totals.overdue} icon={AlertTriangle} color="text-red-400 from-red-500/20" />
      </div>

      <Card className="gradient-card border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-base flex-1">{t("invoices.title")}</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("status.all")}</SelectItem>
                <SelectItem value="unpaid">{t("status.unpaid")}</SelectItem>
                <SelectItem value="paid">{t("status.paid")}</SelectItem>
                <SelectItem value="overdue">{t("status.overdue")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("invoices.col.number")}</TableHead>
                <TableHead>{t("invoices.col.customer")}</TableHead>
                <TableHead>{t("invoices.col.amount")}</TableHead>
                <TableHead>{t("invoices.col.status")}</TableHead>
                <TableHead>{t("invoices.col.dueDate")}</TableHead>
                <TableHead>{t("invoices.col.issuedAt")}</TableHead>
                {isAdmin && <TableHead className="text-end">{t("common.actions")}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">{t("common.loading")}</TableCell></TableRow>
              )}
              {!isLoading && invoices.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">{t("invoices.empty")}</TableCell></TableRow>
              )}
              {invoices.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs font-semibold">INV-{String(inv.invoice_number ?? inv.id.slice(0, 6)).toUpperCase()}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{inv.customer?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{inv.customer?.code}</div>
                  </TableCell>
                  <TableCell className="font-semibold">{fmtMoney(inv.amount)}</TableCell>
                  <TableCell><InvoiceStatusBadge status={inv.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{inv.due_date ? format(new Date(inv.due_date), "MMM d, yyyy") : "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(inv.created_at), "MMM d, yyyy")}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-end space-x-1">
                      {inv.status !== "paid" && (
                        <Button size="sm" variant="ghost" onClick={() => markPaid.mutate(inv.id)} title={t("invoices.markPaid")}>
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => del.mutate(inv.id)}>
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

function InvoiceStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    unpaid: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    overdue: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  };
  return <Badge variant="outline" className={map[status] ?? ""}>{status}</Badge>;
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  const [iconColor, gradColor] = color.split(" ");
  return (
    <Card className={cn("gradient-card border-border/50 overflow-hidden relative")}>
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

function InvoiceForm({ customers, onDone }: { customers: any[]; onDone: () => void }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ customer_id: "", amount: "", due_date: "", notes: "", status: "unpaid" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("invoices").insert({
      customer_id: form.customer_id || null,
      amount: Number(form.amount),
      due_date: form.due_date || null,
      notes: form.notes || null,
      status: form.status as "unpaid" | "paid" | "overdue",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("invoices.created"));
    onDone();
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{t("invoices.new")}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="grid gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">{t("invoices.f.customer")}</Label>
          <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
            <SelectTrigger><SelectValue placeholder={t("common.none")} /></SelectTrigger>
            <SelectContent>
              {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name} — {c.code}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("invoices.f.amount")}</Label>
            <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("invoices.f.dueDate")}</Label>
            <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("common.status")}</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unpaid">{t("status.unpaid")}</SelectItem>
              <SelectItem value="paid">{t("status.paid")}</SelectItem>
              <SelectItem value="overdue">{t("status.overdue")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("invoices.f.notes")}</Label>
          <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={busy} className="gradient-brand text-primary-foreground">
            {busy ? t("common.saving") : t("common.create")}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n));
}
