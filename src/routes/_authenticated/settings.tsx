import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Settings, Building2, CreditCard, Network, Bell, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

const TABS = [
  { key: "general", labelKey: "settings.section.general", icon: Building2 },
  { key: "billing", labelKey: "settings.section.billing", icon: CreditCard },
  { key: "network", labelKey: "settings.section.network", icon: Network },
  { key: "notifications", labelKey: "settings.section.notifications", icon: Bell },
  { key: "security", labelKey: "settings.section.security", icon: Shield },
];

type SettingsRow = {
  company_name: string;
  company_email: string | null;
  company_phone: string | null;
  currency: string;
  timezone: string;
  invoice_prefix: string;
  invoice_due_days: number;
  tax_rate: number;
  default_network_profile: string | null;
};

const DEFAULTS: SettingsRow = {
  company_name: "ME Internet",
  company_email: "",
  company_phone: "",
  currency: "USD",
  timezone: "Asia/Riyadh",
  invoice_prefix: "INV",
  invoice_due_days: 30,
  tax_rate: 0,
  default_network_profile: "",
};

function SettingsPage() {
  const { isAdmin } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  const [form, setForm] = useState<SettingsRow>(DEFAULTS);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*").eq("id", 1).single();
      if (error && error.code !== "PGRST116") throw error;
      return data as SettingsRow | null;
    },
  });

  useEffect(() => {
    if (settingsData) {
      setForm({
        company_name: settingsData.company_name ?? DEFAULTS.company_name,
        company_email: settingsData.company_email ?? "",
        company_phone: settingsData.company_phone ?? "",
        currency: settingsData.currency ?? DEFAULTS.currency,
        timezone: settingsData.timezone ?? DEFAULTS.timezone,
        invoice_prefix: settingsData.invoice_prefix ?? DEFAULTS.invoice_prefix,
        invoice_due_days: settingsData.invoice_due_days ?? DEFAULTS.invoice_due_days,
        tax_rate: settingsData.tax_rate ?? DEFAULTS.tax_rate,
        default_network_profile: settingsData.default_network_profile ?? "",
      });
    }
  }, [settingsData]);

  const save = useMutation({
    mutationFn: async (updates: Partial<SettingsRow>) => {
      const { error } = await supabase.from("settings").upsert({ id: 1, ...updates, updated_at: new Date().toISOString() } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success(t("settings.saved"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  const readOnly = !isAdmin;

  const handleSave = () => save.mutate(form);

  if (readOnly && settingsData) {
    const rows: [string, string][] = [
      [t("settings.f.companyName"), settingsData.company_name ?? "—"],
      [t("settings.f.companyEmail"), settingsData.company_email ?? "—"],
      [t("settings.f.companyPhone"), settingsData.company_phone ?? "—"],
      [t("settings.f.currency"), settingsData.currency ?? "—"],
      [t("settings.f.timezone"), settingsData.timezone ?? "—"],
      [t("settings.f.invoicePrefix"), settingsData.invoice_prefix ?? "—"],
      [t("settings.f.dueDays"), String(settingsData.invoice_due_days ?? 30)],
    ];
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("settings.subtitle")}</p>
        </div>
        <Card className="gradient-card border-border/50 max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">{t("settings.general.title")}</CardTitle>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                <Shield className="w-3 h-3" /> Read-only
              </div>
            </div>
            <CardDescription className="text-xs">Contact your administrator to change these settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {rows.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted-foreground text-xs">{label}</dt>
                  <dd className="font-medium mt-0.5">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("settings.subtitle")}</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="gradient-card border-border/50 lg:col-span-1 h-fit">
          <CardContent className="p-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-start",
                  activeTab === tab.key
                    ? "gradient-brand text-primary-foreground shadow-glow font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                )}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                {t(tab.labelKey)}
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          {activeTab === "general" && (
            <Card className="gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-base">{t("settings.general.title")}</CardTitle>
                <CardDescription className="text-xs">{t("settings.general.desc")}</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">{t("settings.f.companyName")}</Label>
                  <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} disabled={isLoading} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("settings.f.companyEmail")}</Label>
                  <Input type="email" value={form.company_email ?? ""} onChange={(e) => setForm({ ...form, company_email: e.target.value })} disabled={isLoading} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("settings.f.companyPhone")}</Label>
                  <Input value={form.company_phone ?? ""} onChange={(e) => setForm({ ...form, company_phone: e.target.value })} disabled={isLoading} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("settings.f.currency")}</Label>
                  <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })} disabled={isLoading}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD — US Dollar</SelectItem>
                      <SelectItem value="SAR">SAR — Saudi Riyal</SelectItem>
                      <SelectItem value="AED">AED — UAE Dirham</SelectItem>
                      <SelectItem value="EGP">EGP — Egyptian Pound</SelectItem>
                      <SelectItem value="IQD">IQD — Iraqi Dinar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("settings.f.timezone")}</Label>
                  <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })} disabled={isLoading}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Riyadh">Asia/Riyadh (UTC+3)</SelectItem>
                      <SelectItem value="Asia/Dubai">Asia/Dubai (UTC+4)</SelectItem>
                      <SelectItem value="Africa/Cairo">Africa/Cairo (UTC+2)</SelectItem>
                      <SelectItem value="Asia/Baghdad">Asia/Baghdad (UTC+3)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "billing" && (
            <Card className="gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-base">{t("settings.billing.title")}</CardTitle>
                <CardDescription className="text-xs">{t("settings.billing.desc")}</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("settings.f.invoicePrefix")}</Label>
                  <Input value={form.invoice_prefix} onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })} disabled={isLoading} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("settings.f.dueDays")}</Label>
                  <Input type="number" value={form.invoice_due_days} onChange={(e) => setForm({ ...form, invoice_due_days: parseInt(e.target.value) || 30 })} disabled={isLoading} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tax Rate (%)</Label>
                  <Input type="number" step="0.01" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: parseFloat(e.target.value) || 0 })} disabled={isLoading} />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "network" && (
            <Card className="gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Network Settings</CardTitle>
                <CardDescription className="text-xs">Default network profile and RADIUS configuration.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Default Network Profile</Label>
                  <Input value={form.default_network_profile ?? ""} onChange={(e) => setForm({ ...form, default_network_profile: e.target.value })} placeholder="e.g. default-pppoe" disabled={isLoading} />
                </div>
              </CardContent>
            </Card>
          )}

          {(activeTab === "notifications" || activeTab === "security") && (
            <Card className="gradient-card border-border/50">
              <CardContent className="p-12 text-center space-y-3">
                <Settings className="w-12 h-12 mx-auto text-muted-foreground/30" />
                <h3 className="font-semibold">{t("common.comingSoon")}</h3>
                <p className="text-sm text-muted-foreground">{t("common.comingSoonDesc")}</p>
              </CardContent>
            </Card>
          )}

          {activeTab !== "notifications" && activeTab !== "security" && (
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={save.isPending || isLoading} className="gradient-brand text-primary-foreground shadow-glow">
                {save.isPending ? t("common.saving") : t("common.saveChanges")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
