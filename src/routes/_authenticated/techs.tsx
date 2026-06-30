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
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Techs</h1>
          <p className="text-sm text-muted-foreground mt-1">Technician directory · {techs.length}</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(empty); } }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all"><Plus className="mr-2 h-4 w-4" />New tech</Button>
          </DialogTrigger>
          <DialogContent className="glass-strong text-foreground sm:max-w-md">
            <DialogHeader><DialogTitle className="text-foreground font-bold">{editing ? "Edit tech details" : "Add new technician"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label className="text-foreground/80 font-medium">Name *</Label><Input className="glass-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-foreground/80 font-medium">Phone</Label><Input className="glass-input font-mono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label className="text-foreground/80 font-medium">Email</Label><Input className="glass-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-foreground/80 font-medium">Specialization</Label><Input className="glass-input" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} /></div>
                <div><Label className="text-foreground/80 font-medium">Area</Label><Input className="glass-input" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} /></div>
              </div>
              <div><Label className="text-foreground/80 font-medium">Notes</Label><Textarea className="glass-input min-h-20" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button onClick={submit} className="w-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all mt-4">Save technician</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {techs.map((t) => (
          <Card key={t.id} className="glass p-5 text-foreground hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-lg tracking-tight">{t.name}</div>
                  {t.specialization && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full mt-1.5 inline-block">
                      {t.specialization}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="sm" variant="ghost" className="text-foreground hover:bg-foreground/5 h-8 w-8 p-0" onClick={() => openEdit(t)}><Edit className="h-4 w-4" /></Button>
                  {role === "admin" && <Button size="sm" variant="ghost" className="text-rose-500 hover:bg-rose-500/10 h-8 w-8 p-0" onClick={() => del(t)}><Trash2 className="h-4 w-4" /></Button>}
                </div>
              </div>

              <div className="space-y-1.5 border-t border-border/10 pt-3 mt-3 text-sm">
                {t.area && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Area Coverage:</span>
                    <span className="font-semibold text-foreground/90">{t.area}</span>
                  </div>
                )}
                {t.phone && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-mono text-foreground/90 font-semibold">{t.phone}</span>
                  </div>
                )}
                {t.email && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="text-foreground/90 truncate max-w-[150px]">{t.email}</span>
                  </div>
                )}
              </div>
            </div>

            {t.notes && (
              <div className="mt-4 p-2.5 rounded-lg bg-foreground/[0.02] border border-border/5 text-xs text-muted-foreground italic leading-relaxed">
                "{t.notes}"
              </div>
            )}
          </Card>
        ))}
        {techs.length === 0 && <div className="col-span-full py-16 text-center text-muted-foreground">No technicians registered yet</div>}
      </div>
    </div>
  );
}