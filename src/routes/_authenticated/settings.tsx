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
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-sm text-white/60">Manage users and roles</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-500 to-cyan-400 text-white"><Plus className="mr-2 h-4 w-4" />New user</Button>
          </DialogTrigger>
          <DialogContent className="glass-strong text-white sm:max-w-md">
            <DialogHeader><DialogTitle className="text-white">Create user</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-white/80">Name</Label><Input className="glass-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label className="text-white/80">Email</Label><Input className="glass-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label className="text-white/80">Password</Label><Input className="glass-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
              <div><Label className="text-white/80">Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger className="glass-input"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="marketer">Marketer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={submit} className="w-full bg-gradient-to-r from-violet-500 to-cyan-400 text-white">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {users.map((u) => (
          <Card key={u.user_id} className="glass border-white/10 p-4 text-white">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold">{u.name}</div>
                <div className="text-xs text-white/60">{u.email}</div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Select value={u.role} onValueChange={(v) => changeRole(u, v)}>
                  <SelectTrigger className="glass-input h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="marketer">Marketer</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 text-xs">
                  <Switch checked={u.active} onCheckedChange={() => toggleActive(u)} />
                  <span className="text-white/70">{u.active ? "Active" : "Inactive"}</span>
                </div>
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={() => setPwOpen(u)}><Key className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" className="text-red-300 hover:bg-red-500/20" onClick={() => remove(u)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {pwOpen && (
        <Dialog open onOpenChange={() => setPwOpen(null)}>
          <DialogContent className="glass-strong text-white sm:max-w-sm">
            <DialogHeader><DialogTitle className="text-white">Change password</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="text-sm text-white/70">{pwOpen.email}</div>
              <Input className="glass-input" type="password" placeholder="New password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
              <Button onClick={savePw} className="w-full bg-gradient-to-r from-violet-500 to-cyan-400 text-white">Update password</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}