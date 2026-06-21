import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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

function SettingsPage() {
  const { isAdmin } = useAuth();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);

  const [general, setGeneral] = useState({
    companyName: "ME Internet",
    companyEmail: "",
    companyPhone: "",
    currency: "USD",
    timezone: "Asia/Riyadh",
  });

  const [billing, setBilling] = useState({
    invoicePrefix: "INV",
    dueDays: "30",
    taxRate: "0",
  });

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="gradient-card border-border/50 max-w-md w-full">
          <CardContent className="p-10 text-center space-y-3">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <h2 className="text-xl font-bold">Admin Access Required</h2>
            <p className="text-sm text-muted-foreground">Only administrators can access settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success(t("settings.saved"));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("settings.subtitle")}</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar tabs */}
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

        {/* Content area */}
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
                  <Input value={general.companyName} onChange={(e) => setGeneral({ ...general, companyName: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("settings.f.companyEmail")}</Label>
                  <Input type="email" value={general.companyEmail} onChange={(e) => setGeneral({ ...general, companyEmail: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("settings.f.companyPhone")}</Label>
                  <Input value={general.companyPhone} onChange={(e) => setGeneral({ ...general, companyPhone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("settings.f.currency")}</Label>
                  <Select value={general.currency} onValueChange={(v) => setGeneral({ ...general, currency: v })}>
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
                  <Select value={general.timezone} onValueChange={(v) => setGeneral({ ...general, timezone: v })}>
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
                  <Input value={billing.invoicePrefix} onChange={(e) => setBilling({ ...billing, invoicePrefix: e.target.value })} placeholder="INV" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("settings.f.dueDays")}</Label>
                  <Input type="number" value={billing.dueDays} onChange={(e) => setBilling({ ...billing, dueDays: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tax Rate (%)</Label>
                  <Input type="number" step="0.01" value={billing.taxRate} onChange={(e) => setBilling({ ...billing, taxRate: e.target.value })} />
                </div>
              </CardContent>
            </Card>
          )}

          {(activeTab === "network" || activeTab === "notifications" || activeTab === "security") && (
            <Card className="gradient-card border-border/50">
              <CardContent className="p-12 text-center space-y-3">
                <Settings className="w-12 h-12 mx-auto text-muted-foreground/30 animate-spin-slow" />
                <h3 className="font-semibold">{t("common.comingSoon")}</h3>
                <p className="text-sm text-muted-foreground">{t("common.comingSoonDesc")}</p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gradient-brand text-primary-foreground shadow-glow">
              {saving ? t("common.saving") : t("common.saveChanges")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
