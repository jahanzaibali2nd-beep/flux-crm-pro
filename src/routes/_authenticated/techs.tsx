import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/auth-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity";

export const Route = createFileRoute("/_authenticated/techs")({ component: TechsPage });

function TechsPage() {
  const { user, profile, role } = useAuth();
  const [techs, setTechs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const empty = { name: "", phone: "", email: "", specialization: "", area: "", notes: "" };
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    const { data } = await supabase.from("techs").select("*").order("created_at", { ascending: false });
    setTechs(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!user) return;
    if (editing) {
      const { error } = await supabase.from("techs").update(form).eq("id", editing.id);
      if (error) return toast.error(error.message);
      await logActivity({ user_id: user.id, user_name: profile?.name ?? "", action: "edited tech", entity_type: "tech", entity_id: editing.id, details: form.name });
    } else {
      const { error, data } = await supabase.from("techs").insert({ ...form, created_by: user.id }).select().single();
      if (error) return toast.error(error.message);
      await logActivity({ user_id: user.id, user_name: profile?.name ?? "", action: "added tech", entity_type: "tech", entity_id: data.id, details: form.name });
    }
    toast.success("Saved");
    setOpen(false); setEditing(null); setForm(empty); load();
  };

  const del = async (t: any) => {
    if (!confirm(`Delete tech ${t.name}?`)) return;
    const { error } = await supabase.from("techs").delete().eq("id", t.id);
    if (error) return toast.error(error.message);
    if (user) await logActivity({ user_id: user.id, user_name: profile?.name ?? "", action: "deleted tech", entity_type: "tech", entity_id: t.id, details: t.name });
    toast.success("Deleted"); load();
  };

  const openEdit = (t: any) => { setEditing(t); setForm({ name: t.name ?? "", phone: t.phone ?? "", email: t.email ?? "", specialization: t.specialization ?? "", area: t.area ?? "", notes: t.notes ?? "" }); setOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Techs</h1>
          <p className="text-sm text-white/60">Technician directory · {techs.length}</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(empty); } }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-500 to-cyan-400 text-white"><Plus className="mr-2 h-4 w-4" />New tech</Button>
          </DialogTrigger>
          <DialogContent className="glass-strong text-white sm:max-w-md">
            <DialogHeader><DialogTitle className="text-white">{editing ? "Edit tech" : "Add tech"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-white/80">Name *</Label><Input className="glass-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-white/80">Phone</Label><Input className="glass-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label className="text-white/80">Email</Label><Input className="glass-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-white/80">Specialization</Label><Input className="glass-input" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} /></div>
                <div><Label className="text-white/80">Area</Label><Input className="glass-input" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} /></div>
              </div>
              <div><Label className="text-white/80">Notes</Label><Textarea className="glass-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button onClick={submit} className="w-full bg-gradient-to-r from-violet-500 to-cyan-400 text-white">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {techs.map((t) => (
          <Card key={t.id} className="glass border-white/10 p-4 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{t.name}</div>
                {t.specialization && <div className="text-xs text-cyan-300">{t.specialization}</div>}
                {t.area && <div className="text-xs text-white/60">{t.area}</div>}
                {t.phone && <div className="mt-2 text-sm text-white/80">{t.phone}</div>}
                {t.email && <div className="text-sm text-white/60">{t.email}</div>}
                {t.notes && <div className="mt-2 text-xs text-white/50">{t.notes}</div>}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={() => openEdit(t)}><Edit className="h-4 w-4" /></Button>
                {role === "admin" && <Button size="sm" variant="ghost" className="text-red-300 hover:bg-red-500/20" onClick={() => del(t)}><Trash2 className="h-4 w-4" /></Button>}
              </div>
            </div>
          </Card>
        ))}
        {techs.length === 0 && <div className="col-span-full py-12 text-center text-white/50">No techs yet</div>}
      </div>
    </div>
  );
}