import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Search, Zap, ShieldAlert } from "lucide-react";
import { addDays } from "date-fns";

export const Route = createFileRoute("/_authenticated/recharge")({
  component: RechargePage,
});

function RechargePage() {
  const { canRecharge, user } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [packageId, setPackageId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-search", q],
    enabled: q.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("customers")
        .select("id, code, full_name, phone, username, status, package_id")
        .or(`full_name.ilike.%${q}%,code.ilike.%${q}%,username.ilike.%${q}%,phone.ilike.%${q}%`)
        .limit(8);
      return data ?? [];
    },
  });

  const { data: pkgs = [] } = useQuery({
    queryKey: ["packages-list"],
    queryFn: async () => (await supabase.from("packages").select("*").order("price")).data ?? [],
  });

  const pkg = useMemo(() => pkgs.find((p: any) => p.id === packageId), [pkgs, packageId]);

  const submit = async () => {
    if (!selected || !pkg) return;
    setBusy(true);
    const expires = addDays(new Date(), pkg.validity_days).toISOString();

    const ins = await supabase.from("recharges").insert({
      customer_id: selected.id,
      package_id: pkg.id,
      amount: pkg.price,
      validity_days: pkg.validity_days,
      expires_at: expires,
      performed_by: user?.id,
    });
    if (ins.error) {
      setBusy(false);
      return toast.error(ins.error.message);
    }
    const upd = await supabase
      .from("customers")
      .update({ package_id: pkg.id, status: "active", expires_at: expires })
      .eq("id", selected.id);
    setBusy(false);
    if (upd.error) return toast.error(upd.error.message);

    toast.success(t("recharge.success", { name: selected.full_name, pkg: pkg.name }));
    setSelected(null);
    setPackageId("");
    setQ("");
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["customers"] });
  };

  if (!canRecharge) {
    return (
      <Card className="gradient-card border-border/50 max-w-lg">
        <CardContent className="p-8 text-center space-y-3">
          <ShieldAlert className="w-10 h-10 mx-auto text-warning" />
          <h2 className="text-lg font-semibold">{t("recharge.noPerm")}</h2>
          <p className="text-sm text-muted-foreground">{t("recharge.noPermDesc")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("recharge.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("recharge.subtitle")}</p>
      </div>

      <Card className="gradient-card border-border/50">
        <CardHeader><CardTitle className="text-base">{t("recharge.step1")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setSelected(null); }} placeholder={t("recharge.searchPlaceholder")} className="ps-9" />
          </div>
          {!selected && customers.length > 0 && (
            <div className="border border-border/50 rounded-lg divide-y divide-border/40 max-h-72 overflow-y-auto">
              {customers.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="w-full text-start p-3 hover:bg-accent/10 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-sm">{c.full_name}</div>
                    <div className="text-xs text-muted-foreground">{c.code} · {c.username}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">{t(`status.${c.status}`)}</span>
                </button>
              ))}
            </div>
          )}
          {selected && (
            <div className="p-3 rounded-lg gradient-brand text-primary-foreground flex items-center justify-between">
              <div>
                <div className="font-semibold">{selected.full_name}</div>
                <div className="text-xs opacity-80">{selected.code} · {selected.username}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="text-primary-foreground hover:text-primary-foreground hover:bg-white/10">{t("common.change")}</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="gradient-card border-border/50">
        <CardHeader><CardTitle className="text-base">{t("recharge.step2")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">{t("customers.f.package")}</Label>
            <Select value={packageId || undefined} onValueChange={setPackageId} disabled={!selected}>
              <SelectTrigger><SelectValue placeholder={t("recharge.selectPackage")} /></SelectTrigger>
              <SelectContent>
                {pkgs.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {fmt(p.price)} / {p.validity_days}{t("recharge.days") === "days" ? "d" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {pkg && (
            <div className="grid grid-cols-3 gap-3 text-center">
              <Stat label={t("recharge.amount")} value={fmt(pkg.price)} />
              <Stat label={t("recharge.validity")} value={`${pkg.validity_days} ${t("recharge.days")}`} />
              <Stat label={t("recharge.speed")} value={pkg.speed ?? "—"} />
            </div>
          )}
          <Button disabled={!selected || !pkg || busy} onClick={submit} className="w-full gradient-brand text-primary-foreground shadow-glow">
            <Zap className="w-4 h-4 me-2" /> {busy ? t("common.processing") : t("recharge.confirm")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-semibold mt-1">{value}</div>
    </div>
  );
}
function fmt(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n));
}
