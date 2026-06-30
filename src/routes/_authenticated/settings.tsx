import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/integrations/auth-provider";
import { adminListUsers, adminCreateUser, adminUpdateUser, adminDeleteUser } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Key } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

function SettingsPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "marketer" });
  const [pwOpen, setPwOpen] = useState<any | null>(null);
  const [newPw, setNewPw] = useState("");

  useEffect(() => { if (role && role !== "admin") navigate({ to: "/dashboard" }); }, [role]);

  const load = async () => {
    try { setUsers(await adminListUsers()); } catch (e: any) { toast.error(e.message); }
  };
  useEffect(() => { if (role === "admin") load(); }, [role]);

  const submit = async () => {
    try {
      await adminCreateUser({ data: form as any });
      toast.success("User created");
      setOpen(false);
      setForm({ name: "", email: "", password: "", role: "marketer" });
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const toggleActive = async (u: any) => {
    try { await adminUpdateUser({ data: { user_id: u.user_id, active: !u.active } }); load(); }
    catch (e: any) { toast.error(e.message); }
  };
  const changeRole = async (u: any, r: string) => {
    try { await adminUpdateUser({ data: { user_id: u.user_id, role: r as any } }); load(); }
    catch (e: any) { toast.error(e.message); }
  };
  const remove = async (u: any) => {
    if (!confirm(`Delete ${u.email}?`)) return;
    try { await adminDeleteUser({ data: { user_id: u.user_id } }); toast.success("Deleted"); load(); }
    catch (e: any) { toast.error(e.message); }
  };
  const savePw = async () => {
    try { await adminUpdateUser({ data: { user_id: pwOpen.user_id, password: newPw } }); toast.success("Password updated"); setPwOpen(null); setNewPw(""); }
    catch (e: any) { toast.error(e.message); }
  };

  if (role !== "admin") return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage users and roles</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all"><Plus className="mr-2 h-4 w-4" />New user</Button>
          </DialogTrigger>
          <DialogContent className="glass-strong text-foreground sm:max-w-md">
            <DialogHeader><DialogTitle className="text-foreground font-bold">Create user account</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label className="text-foreground/80 font-medium">Name</Label><Input className="glass-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label className="text-foreground/80 font-medium">Email</Label><Input className="glass-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label className="text-foreground/80 font-medium">Password</Label><Input className="glass-input font-mono" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
              <div><Label className="text-foreground/80 font-medium">Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger className="glass-input"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="marketer">Marketer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={submit} className="w-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all mt-4">Create account</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {users.map((u) => (
          <Card key={u.user_id} className="glass p-4 text-foreground hover:scale-[1.01] transition-all duration-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-bold text-base tracking-tight">{u.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{u.email}</div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Select value={u.role} onValueChange={(v) => changeRole(u, v)}>
                  <SelectTrigger className="glass-input h-8 w-32 text-xs font-semibold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="marketer">Marketer</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 text-xs font-medium">
                  <Switch checked={u.active} onCheckedChange={() => toggleActive(u)} />
                  <span className="text-foreground/70">{u.active ? "Active" : "Inactive"}</span>
                </div>
                <Button size="sm" variant="ghost" className="text-foreground hover:bg-foreground/5 h-8 w-8 p-0" onClick={() => setPwOpen(u)}><Key className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" className="text-rose-500 hover:bg-rose-500/10 h-8 w-8 p-0" onClick={() => remove(u)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {pwOpen && (
        <Dialog open onOpenChange={() => setPwOpen(null)}>
          <DialogContent className="glass-strong text-foreground sm:max-w-sm">
            <DialogHeader><DialogTitle className="text-foreground font-bold">Change password</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="text-xs font-semibold text-muted-foreground bg-foreground/[0.03] p-2.5 rounded-lg border border-border/10 font-mono truncate">{pwOpen.email}</div>
              <div><Label className="text-foreground/80 font-medium">New password</Label>
                <Input className="glass-input font-mono mt-1" type="password" placeholder="Min 6 characters" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
              </div>
              <Button onClick={savePw} className="w-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all mt-4">Update password</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}