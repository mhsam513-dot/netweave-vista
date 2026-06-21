import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Radio, Plus, Trash2, Server } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/towers")({
  component: TowersPage,
});

function TowersPage() {
  const { isAdmin } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: towers = [] } = useQuery({
    queryKey: ["towers-full"],
    queryFn: async () => (await supabase.from("towers").select("*").order("name")).data ?? [],
  });
  const { data: sectors = [] } = useQuery({
    queryKey: ["sectors-full"],
    queryFn: async () => (await supabase.from("sectors").select("*")).data ?? [],
  });
  const { data: devices = [] } = useQuery({
    queryKey: ["devices-full"],
    queryFn: async () => (await supabase.from("devices").select("*")).data ?? [],
  });

  const addTower = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from("towers").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["towers-full"] }); toast.success(t("towers.added")); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const addSector = useMutation({
    mutationFn: async ({ tower_id, name }: { tower_id: string; name: string }) => {
      const { error } = await supabase.from("sectors").insert({ tower_id, name });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sectors-full"] }); toast.success(t("towers.sectorAdded")); },
    onError: (e: any) => toast.error(e.message),
  });

  const addDevice = useMutation({
    mutationFn: async ({ tower_id, name, ip_address }: any) => {
      const { error } = await supabase.from("devices").insert({ tower_id, name, ip_address: ip_address || null });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["devices-full"] }); toast.success(t("towers.deviceAdded")); },
    onError: (e: any) => toast.error(e.message),
  });

  const delThing = useMutation({
    mutationFn: async ({ table, id }: { table: "towers" | "sectors" | "devices"; id: string }) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: [`${vars.table}-full`] });
      toast.success(t("common.deleted"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("towers.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("towers.subtitle")}</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-brand text-primary-foreground shadow-glow">
                <Plus className="w-4 h-4 me-1" /> {t("towers.new")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t("towers.new")}</DialogTitle></DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  addTower.mutate({ name: fd.get("name"), location: fd.get("location") });
                }}
                className="space-y-3"
              >
                <div className="space-y-1.5"><Label className="text-xs">{t("towers.f.name")}</Label><Input name="name" required /></div>
                <div className="space-y-1.5"><Label className="text-xs">{t("towers.f.location")}</Label><Input name="location" /></div>
                <DialogFooter><Button type="submit" className="gradient-brand text-primary-foreground">{t("common.create")}</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {towers.length === 0 && (
          <Card className="gradient-card border-border/50"><CardContent className="p-8 text-center text-muted-foreground">{t("towers.empty")}</CardContent></Card>
        )}
        {towers.map((tw: any) => {
          const tSectors = sectors.filter((s: any) => s.tower_id === tw.id);
          const tDevices = devices.filter((d: any) => d.tower_id === tw.id);
          return (
            <Card key={tw.id} className="gradient-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Radio className="w-4 h-4 text-accent" /> {tw.name}
                  {tw.location && <span className="text-xs font-normal text-muted-foreground">· {tw.location}</span>}
                </CardTitle>
                {isAdmin && (
                  <Button size="sm" variant="ghost" onClick={() => delThing.mutate({ table: "towers", id: tw.id })}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{t("towers.sectors")}</div>
                  <div className="flex flex-wrap gap-2">
                    {tSectors.map((s: any) => (
                      <span key={s.id} className="px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs flex items-center gap-1.5">
                        {s.name}
                        {isAdmin && (
                          <button onClick={() => delThing.mutate({ table: "sectors", id: s.id })} className="opacity-60 hover:opacity-100">×</button>
                        )}
                      </span>
                    ))}
                    {tSectors.length === 0 && <span className="text-xs text-muted-foreground">{t("common.none")}</span>}
                  </div>
                  {isAdmin && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        addSector.mutate({ tower_id: tw.id, name: String(fd.get("name")) });
                        (e.currentTarget as HTMLFormElement).reset();
                      }}
                      className="flex gap-2 mt-2"
                    >
                      <Input name="name" placeholder={t("towers.sectorName")} required className="h-8 text-sm" />
                      <Button size="sm" type="submit" variant="secondary">{t("common.add")}</Button>
                    </form>
                  )}
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Server className="w-3 h-3" /> {t("towers.devices")}
                  </div>
                  <ul className="space-y-1.5">
                    {tDevices.map((d: any) => (
                      <li key={d.id} className="flex items-center justify-between text-sm px-2 py-1 rounded bg-muted/30">
                        <span>{d.name}{d.ip_address ? <span className="text-muted-foreground"> · {d.ip_address}</span> : null}</span>
                        {isAdmin && (
                          <button onClick={() => delThing.mutate({ table: "devices", id: d.id })} className="opacity-60 hover:opacity-100">
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        )}
                      </li>
                    ))}
                    {tDevices.length === 0 && <li className="text-xs text-muted-foreground">{t("common.none")}</li>}
                  </ul>
                  {isAdmin && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        addDevice.mutate({
                          tower_id: tw.id,
                          name: String(fd.get("name")),
                          ip_address: String(fd.get("ip") ?? ""),
                        });
                        (e.currentTarget as HTMLFormElement).reset();
                      }}
                      className="flex gap-2 mt-2"
                    >
                      <Input name="name" placeholder={t("towers.deviceName")} required className="h-8 text-sm" />
                      <Input name="ip" placeholder={t("towers.ipOptional")} className="h-8 text-sm w-40" />
                      <Button size="sm" type="submit" variant="secondary">{t("common.add")}</Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
