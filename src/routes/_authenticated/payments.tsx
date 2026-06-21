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
import { Plus, CreditCard, DollarSign, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { format, startOfDay, startOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/payments")({
  component: PaymentsPage,
});

const METHODS = ["cash", "bank", "online"];

function PaymentsPage() {
  const { isAdmin, canRecharge } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [methodFilter, setMethodFilter] = useState("all");

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments", methodFilter],
    queryFn: async () => {
      let q = supabase
        .from("payments")
        .select("*, customer:customers(full_name, code)")
        .order("created_at", { ascending: false });
      if (methodFilter !== "all") q = q.eq("method", methodFilter as "cash" | "bank" | "online");
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-list"],
    queryFn: async () => (await supabase.from("customers").select("id, full_name, code").order("full_name")).data ?? [],
  });

  const { data: summaries } = useQuery({
    queryKey: ["payments-summary"],
    queryFn: async () => {
      const todayStart = startOfDay(new Date()).toISOString();
      const monthStart = startOfMonth(new Date()).toISOString();
      const [today, month] = await Promise.all([
        supabase.from("payments").select("amount").gte("created_at", todayStart),
        supabase.from("payments").select("amount").gte("created_at", monthStart),
      ]);
      return {
        today: (today.data ?? []).reduce((s, p) => s + Number(p.amount), 0),
        month: (month.data ?? []).reduce((s, p) => s + Number(p.amount), 0),
      };
    },
  });

  const totalAmount = payments.reduce((s: number, p: any) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("payments.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("payments.subtitle")}</p>
        </div>
        {(isAdmin || canRecharge) && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-brand text-primary-foreground shadow-glow">
                <Plus className="w-4 h-4 me-1" /> {t("payments.new")}
              </Button>
            </DialogTrigger>
            <PaymentForm customers={customers} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["payments"] }); }} />
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="gradient-card border-border/50 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-transparent opacity-50" />
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{t("payments.totalToday")}</span>
              <CreditCard className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-2xl font-bold">{fmtMoney(summaries?.today ?? 0)}</div>
          </CardContent>
        </Card>
        <Card className="gradient-card border-border/50 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-50" />
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{t("payments.totalMonth")}</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold">{fmtMoney(summaries?.month ?? 0)}</div>
          </CardContent>
        </Card>
        <Card className="gradient-card border-border/50 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent opacity-50" />
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Currently Shown</span>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold">{fmtMoney(totalAmount)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="gradient-card border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-base flex-1">{t("payments.title")}</CardTitle>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {METHODS.map((m) => <SelectItem key={m} value={m}>{t(`payments.method.${m}`)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("payments.col.reference")}</TableHead>
                <TableHead>{t("payments.col.customer")}</TableHead>
                <TableHead>{t("payments.col.amount")}</TableHead>
                <TableHead>{t("payments.col.method")}</TableHead>
                <TableHead>{t("payments.col.date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">{t("common.loading")}</TableCell></TableRow>
              )}
              {!isLoading && payments.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">{t("payments.empty")}</TableCell></TableRow>
              )}
              {payments.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.reference ?? p.id.slice(0, 8).toUpperCase()}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{p.customer?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{p.customer?.code}</div>
                  </TableCell>
                  <TableCell className="font-semibold">{fmtMoney(p.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{t(`payments.method.${p.method}`)}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(p.created_at), "MMM d, yyyy HH:mm")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentForm({ customers, onDone }: { customers: any[]; onDone: () => void }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ customer_id: "", amount: "", method: "cash", reference: "", notes: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("payments").insert({
      customer_id: form.customer_id || null,
      amount: Number(form.amount),
      method: form.method as "cash" | "bank" | "online",
      reference: form.reference || null,
      notes: form.notes || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("payments.created"));
    onDone();
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{t("payments.new")}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="grid gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">{t("payments.f.customer")}</Label>
          <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
            <SelectTrigger><SelectValue placeholder={t("common.none")} /></SelectTrigger>
            <SelectContent>
              {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name} — {c.code}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("payments.f.amount")}</Label>
            <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("payments.f.method")}</Label>
            <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => <SelectItem key={m} value={m}>{t(`payments.method.${m}`)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("payments.f.reference")}</Label>
          <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("payments.f.notes")}</Label>
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
