import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Pencil, Infinity as Inf } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/packages")({
  component: PackagesPage,
});

function PackagesPage() {
  const { isAdmin } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: pkgs = [] } = useQuery({
    queryKey: ["packages-full"],
    queryFn: async () =>
      (await supabase.from("packages").select("*").order("price")).data ?? [],
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("packages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["packages-full"] });
      toast.success(t("packages.deleted"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("packages.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("packages.subtitle")}</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button className="gradient-brand text-primary-foreground shadow-glow">
                <Plus className="w-4 h-4 mr-1" /> {t("packages.new")}
              </Button>
            </DialogTrigger>
            <PackageForm
              key={editing?.id ?? "new"}
              editing={editing}
              onDone={() => {
                setOpen(false);
                setEditing(null);
                qc.invalidateQueries({ queryKey: ["packages-full"] });
              }}
            />
          </Dialog>
        )}
      </div>

      <Card className="gradient-card border-border/50">
        <CardContent className="p-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.name")}</TableHead>
                <TableHead>{t("packages.col.type")}</TableHead>
                <TableHead>{t("packages.col.speed")}</TableHead>
                <TableHead>{t("packages.col.data")}</TableHead>
                <TableHead>{t("packages.col.validity")}</TableHead>
                <TableHead>{t("packages.col.price")}</TableHead>
                {isAdmin && <TableHead className="text-right">{t("common.actions")}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pkgs.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">{t("packages.empty")}</TableCell></TableRow>
              )}
              {pkgs.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell><Badge variant="outline">{t(`packages.type.${p.package_type}`)}</Badge></TableCell>
                  <TableCell>{p.speed ?? "—"}</TableCell>
                  <TableCell>{p.data_limit_gb ? `${p.data_limit_gb} GB` : <Inf className="w-4 h-4 inline opacity-60" />}</TableCell>
                  <TableCell>{p.validity_days}d</TableCell>
                  <TableCell className="font-semibold">{fmt(p.price)}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(p); setOpen(true); }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => del.mutate(p.id)}>
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

function PackageForm({ editing, onDone }: { editing: any; onDone: () => void }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    price: editing?.price ?? 0,
    data_limit_gb: editing?.data_limit_gb ?? "",
    speed: editing?.speed ?? "",
    validity_days: editing?.validity_days ?? 30,
    package_type: editing?.package_type ?? "unlimited",
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload: any = {
      ...form,
      price: Number(form.price),
      validity_days: Number(form.validity_days),
      data_limit_gb: form.data_limit_gb === "" ? null : Number(form.data_limit_gb),
      speed: form.speed || null,
    };
    const res = editing
      ? await supabase.from("packages").update(payload).eq("id", editing.id)
      : await supabase.from("packages").insert(payload);
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(editing ? t("packages.updated") : t("packages.created"));
    onDone();
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{editing ? t("packages.formEdit") : t("packages.formNew")}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label className="text-xs">{t("common.name")}</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("packages.col.type")}</Label>
          <Select value={form.package_type} onValueChange={(v) => setForm({ ...form, package_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unlimited">{t("packages.type.unlimited")}</SelectItem>
              <SelectItem value="quota">{t("packages.type.quota")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("packages.col.price")}</Label>
          <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("packages.f.speed")}</Label>
          <Input value={form.speed} onChange={(e) => setForm({ ...form, speed: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("packages.f.dataLimit")}</Label>
          <Input type="number" step="0.01" value={form.data_limit_gb} onChange={(e) => setForm({ ...form, data_limit_gb: e.target.value })} placeholder={t("packages.f.dataPlaceholder")} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label className="text-xs">{t("packages.f.validity")}</Label>
          <Input type="number" value={form.validity_days} onChange={(e) => setForm({ ...form, validity_days: e.target.value })} required />
        </div>
        <DialogFooter className="col-span-2">
          <Button type="submit" disabled={busy} className="gradient-brand text-primary-foreground">{busy ? t("common.saving") : t("common.save")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n));
}
