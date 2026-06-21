import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
});

const ROLES = ["admin", "recharge", "viewer"] as const;

function UsersPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ["users-list"],
    enabled: isAdmin,
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, created_at").order("created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role),
      }));
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ userId, role, has }: { userId: string; role: string; has: boolean }) => {
      if (has) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users-list"] }); toast.success("Roles updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  if (!isAdmin) {
    return (
      <Card className="gradient-card border-border/50 max-w-lg">
        <CardContent className="p-8 text-center space-y-3">
          <ShieldAlert className="w-10 h-10 mx-auto text-warning" />
          <h2 className="text-lg font-semibold">Admins only</h2>
          <p className="text-sm text-muted-foreground">Only administrators can manage user roles.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Users & Roles</h1>
        <p className="text-muted-foreground text-sm mt-1">Assign Admin, Recharge or Viewer roles. Users sign up from the auth page.</p>
      </div>

      <Card className="gradient-card border-border/50">
        <CardContent className="p-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Current roles</TableHead>
                <TableHead className="text-right">Toggle roles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.roles.length === 0 && <span className="text-xs text-muted-foreground">none</span>}
                      {u.roles.map((r: string) => (
                        <Badge key={r} variant="outline" className="capitalize gradient-brand text-primary-foreground border-0">{r}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex flex-wrap gap-1 justify-end">
                      {ROLES.map((r) => {
                        const has = u.roles.includes(r);
                        return (
                          <Button
                            key={r}
                            size="sm"
                            variant={has ? "default" : "outline"}
                            className={has ? "gradient-brand text-primary-foreground" : ""}
                            onClick={() => toggle.mutate({ userId: u.id, role: r, has })}
                          >
                            {has ? "✓ " : ""}{r}
                          </Button>
                        );
                      })}
                    </div>
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
