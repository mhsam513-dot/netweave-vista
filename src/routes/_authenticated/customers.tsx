import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Pause, Play, Plus, Search, Pencil } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/customers")({
  component: CustomersPage,
});

type Customer = any;

function CustomersPage() {
  const { isAdmin, canRecharge } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const customersQ = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*, package:packages(name, price), tower:towers(name), sector:sectors(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const packagesQ = useQuery({
    queryKey: ["packages"],
    queryFn: async () => (await supabase.from("packages").select("id, name").order("name")).data ?? [],
  });
  const towersQ = useQuery({
    queryKey: ["towers"],
    queryFn: async () => (await supabase.from("towers").select("id, name").order("name")).data ?? [],
  });
  const sectorsQ = useQuery({
    queryKey: ["sectors"],
    queryFn: async () => (await supabase.from("sectors").select("id, name, tower_id")).data ?? [],
  });

  const filtered = useMemo(() => {
    const list = customersQ.data ?? [];
    return list.filter((c: any) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      const s = q.toLowerCase();
      return (
        c.full_name?.toLowerCase().includes(s) ||
        c.username?.toLowerCase().includes(s) ||
        c.code?.toLowerCase().includes(s) ||
        c.phone?.toLowerCase().includes(s)
      );
    });
  }, [customersQ.data, q, statusFilter]);

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: any }) => {
      const { error } = await supabase.from("customers").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success(t("customers.updated"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("customers.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("customers.subtitle")}</p>
        </div>
        {isAdmin && (
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) setEditing(null);
            }}
          >
            <DialogTrigger asChild>
              <Button className="gradient-brand text-primary-foreground shadow-glow">
                <Plus className="w-4 h-4 me-1" /> {t("customers.add")}
              </Button>
            </DialogTrigger>
            <CustomerForm
              key={editing?.id ?? "new"}
              editing={editing}
              packages={packagesQ.data ?? []}
              towers={towersQ.data ?? []}
              sectors={sectorsQ.data ?? []}
              onDone={() => {
                setOpen(false);
                setEditing(null);
                qc.invalidateQueries({ queryKey: ["customers"] });
              }}
            />
          </Dialog>
        )}
      </div>

      <Card className="gradient-card border-border/50">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("customers.searchPlaceholder")}
                className="ps-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("status.all")}</SelectItem>
                <SelectItem value="active">{t("status.active")}</SelectItem>
                <SelectItem value="suspended">{t("status.suspended")}</SelectItem>
                <SelectItem value="expired">{t("status.expired")}</SelectItem>
                <SelectItem value="pending">{t("status.pending")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("customers.col.code")}</TableHead>
                  <TableHead>{t("customers.col.name")}</TableHead>
                  <TableHead>{t("customers.col.service")}</TableHead>
                  <TableHead>{t("customers.col.package")}</TableHead>
                  <TableHead>{t("customers.col.tower")}</TableHead>
                  <TableHead>{t("customers.col.status")}</TableHead>
                  <TableHead className="text-end">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      {t("customers.empty")}
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.code}</TableCell>
                    <TableCell>
                      <Link to="/customers/$id" params={{ id: c.id }} className="hover:text-accent font-medium">
                        {c.full_name}
                      </Link>
                      <div className="text-xs text-muted-foreground">{c.phone ?? "—"}</div>
                    </TableCell>
                    <TableCell>{t(`service.${c.service_type}`)}</TableCell>
                    <TableCell>{c.package?.name ?? "—"}</TableCell>
                    <TableCell>
                      {c.tower?.name ?? "—"}
                      {c.sector?.name ? <span className="text-muted-foreground"> / {c.sector.name}</span> : null}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-end space-x-1">
                      {(isAdmin || canRecharge) &&
                        (c.status === "active" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setStatus.mutate({ id: c.id, status: "suspended" })}
                          >
                            <Pause className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setStatus.mutate({ id: c.id, status: "active" })}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        ))}
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditing(c);
                            setOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const map: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    suspended: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    expired: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    pending: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  };
  return <Badge variant="outline" className={map[status] ?? ""}>{t(`status.${status}`)}</Badge>;
}

function CustomerForm({
  editing,
  packages,
  towers,
  sectors,
  onDone,
}: {
  editing: Customer | null;
  packages: { id: string; name: string }[];
  towers: { id: string; name: string }[];
  sectors: { id: string; name: string; tower_id: string }[];
  onDone: () => void;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    full_name: editing?.full_name ?? "",
    phone: editing?.phone ?? "",
    address: editing?.address ?? "",
    service_type: editing?.service_type ?? "pppoe",
    username: editing?.username ?? "",
    password: editing?.password ?? "",
    package_id: editing?.package_id ?? "",
    tower_id: editing?.tower_id ?? "",
    sector_id: editing?.sector_id ?? "",
    status: editing?.status ?? "active",
  });
  const [busy, setBusy] = useState(false);

  const towerSectors = sectors.filter((s) => s.tower_id === form.tower_id);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload: any = { ...form };
    Object.keys(payload).forEach((k) => payload[k] === "" && (payload[k] = null));
    let res;
    if (editing) {
      res = await supabase.from("customers").update(payload).eq("id", editing.id);
    } else {
      res = await supabase.from("customers").insert(payload);
    }
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(editing ? t("customers.updated") : t("customers.created"));
    onDone();
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{editing ? t("customers.formEdit") : t("customers.formNew")}</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
        <Field label={t("customers.f.fullName")} required>
          <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        </Field>
        <Field label={t("customers.f.phone")}>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label={t("customers.f.address")} className="sm:col-span-2">
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </Field>
        <Field label={t("customers.f.serviceType")}>
          <Select value={form.service_type} onValueChange={(v) => setForm({ ...form, service_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pppoe">{t("service.pppoe")}</SelectItem>
              <SelectItem value="hotspot">{t("service.hotspot")}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("customers.f.status")}>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t("status.active")}</SelectItem>
              <SelectItem value="suspended">{t("status.suspended")}</SelectItem>
              <SelectItem value="expired">{t("status.expired")}</SelectItem>
              <SelectItem value="pending">{t("status.pending")}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("customers.f.username")} required>
          <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        </Field>
        <Field label={t("customers.f.password")} required>
          <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </Field>
        <Field label={t("customers.f.package")}>
          <Select value={form.package_id || undefined} onValueChange={(v) => setForm({ ...form, package_id: v })}>
            <SelectTrigger><SelectValue placeholder={t("common.none")} /></SelectTrigger>
            <SelectContent>
              {packages.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("customers.f.tower")}>
          <Select value={form.tower_id || undefined} onValueChange={(v) => setForm({ ...form, tower_id: v, sector_id: "" })}>
            <SelectTrigger><SelectValue placeholder={t("common.none")} /></SelectTrigger>
            <SelectContent>
              {towers.map((tw) => <SelectItem key={tw.id} value={tw.id}>{tw.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t("customers.f.sector")}>
          <Select value={form.sector_id || undefined} onValueChange={(v) => setForm({ ...form, sector_id: v })} disabled={!form.tower_id}>
            <SelectTrigger><SelectValue placeholder={t("common.none")} /></SelectTrigger>
            <SelectContent>
              {towerSectors.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>

        <DialogFooter className="sm:col-span-2">
          <Button type="submit" disabled={busy} className="gradient-brand text-primary-foreground">
            {busy ? t("common.saving") : editing ? t("common.saveChanges") : t("common.create")}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function Field({
  label,
  children,
  required,
  className,
}: { label: string; children: React.ReactNode; required?: boolean; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
