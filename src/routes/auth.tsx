import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wifi } from "lucide-react";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/language-switcher";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const { t, dir } = useI18n();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await signIn(String(fd.get("email")), String(fd.get("password")));
    setBusy(false);
    if (error) toast.error(error);
    else toast.success(t("auth.welcome"));
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await signUp(
      String(fd.get("email")),
      String(fd.get("password")),
      String(fd.get("name")),
    );
    setBusy(false);
    if (error) toast.error(error);
    else toast.success(t("auth.created"));
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2" dir={dir}>
      <div className="hidden lg:flex relative gradient-brand p-12 flex-col justify-between">
        <div className="flex items-center gap-2 text-primary-foreground">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Wifi className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg">{t("app.name")}</span>
        </div>
        <div className="text-primary-foreground space-y-4 max-w-md">
          <h1 className="text-5xl font-bold leading-tight">{t("auth.brandHeadline")}</h1>
          <p className="text-white/80 text-lg">{t("auth.brandSub")}</p>
        </div>
        <div className="text-white/60 text-sm">{t("auth.copyright")}</div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 bg-background relative">
        <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
              <Wifi className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">{t("app.name")}</span>
          </div>

          <h2 className="text-2xl font-semibold">{t("auth.title")}</h2>
          <p className="text-muted-foreground text-sm mt-1 mb-6">{t("auth.subtitle")}</p>

          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">{t("auth.signIn")}</TabsTrigger>
              <TabsTrigger value="signup">{t("auth.signUp")}</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="si-email">{t("common.email")}</Label>
                  <Input id="si-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="si-pass">{t("common.password")}</Label>
                  <Input id="si-pass" name="password" type="password" required autoComplete="current-password" />
                </div>
                <Button type="submit" disabled={busy} className="w-full gradient-brand text-primary-foreground shadow-glow">
                  {busy ? t("common.signingIn") : t("auth.signIn")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="su-name">{t("customers.f.fullName")}</Label>
                  <Input id="su-name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-email">{t("common.email")}</Label>
                  <Input id="su-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-pass">{t("common.password")}</Label>
                  <Input id="su-pass" name="password" type="password" required minLength={6} autoComplete="new-password" />
                </div>
                <Button type="submit" disabled={busy} className="w-full gradient-brand text-primary-foreground shadow-glow">
                  {busy ? t("common.creating") : t("auth.createAccount")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
