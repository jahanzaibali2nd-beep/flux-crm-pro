import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/auth-provider";
import { LeadFormDialog } from "@/components/LeadFormDialog";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity";
import { Search, Edit, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/leads")({ component: LeadsPage });

const STATUSES = ["new", "contacted", "scheduled", "in_progress", "won", "lost", "follow_up"] as const;

const statusColor: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600 dark:text-blue-300 dark:bg-blue-500/20 border border-blue-500/20",
  contacted: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 dark:bg-cyan-500/20 border border-cyan-500/20",
  scheduled: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 dark:bg-indigo-500/20 border border-indigo-500/20",
  in_progress: "bg-amber-500/10 text-amber-600 dark:text-amber-300 dark:bg-amber-500/20 border border-amber-500/20",
  won: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 dark:bg-emerald-500/20 border border-emerald-500/20",
  lost: "bg-rose-500/10 text-rose-600 dark:text-rose-300 dark:bg-rose-500/20 border border-rose-500/20",
  follow_up: "bg-pink-500/10 text-pink-600 dark:text-pink-300 dark:bg-pink-500/20 border border-pink-500/20",
};

function LeadsPage() {
  const { user, profile, role } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [techs, setTechs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<any | null>(null);

  const load = async () => {
    const { data } = await supabase.from("leads").select("*, techs(name)").order("created_at", { ascending: false });
    setLeads(data ?? []);
    const { data: t } = await supabase.from("techs").select("id,name").eq("active", true);
    setTechs(t ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const filtered = leads.filter((l) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      l.customer_name?.toLowerCase().includes(s) ||
      l.customer_number?.toLowerCase().includes(s) ||
      l.service?.toLowerCase().includes(s) ||
      l.area?.toLowerCase().includes(s)
    );
  });

  const updateLead = async (id: string, patch: any, action: string) => {
    const { error } = await supabase.from("leads").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    if (user) await logActivity({ user_id: user.id, user_name: profile?.name ?? "", action, entity_type: "lead", entity_id: id });
    toast.success("Updated");
    load();
  };

  const deleteLead = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (user) await logActivity({ user_id: user.id, user_name: profile?.name ?? "", action: "deleted lead", entity_type: "lead", entity_id: id });
    toast.success("Deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} of {leads.length} leads</p>
        </div>
        <LeadFormDialog onCreated={load} />
      </div>

      <Card className="glass p-4 text-foreground">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input className="glass-input pl-9" placeholder="Search name, number, service, area..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="glass-input w-full sm:w-48 text-foreground"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="grid gap-3">
        {filtered.map((l) => (
          <Card key={l.id} className="glass p-4 text-foreground hover:scale-[1.01] transition-all duration-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-base tracking-tight">{l.customer_name}</span>
                  <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor[l.status]}`}>{l.status.replace("_", " ")}</Badge>
                </div>
                <div className="mt-1 text-sm text-foreground/80">{l.service} · <span className="font-mono text-xs">{l.customer_number}</span></div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {l.area} {l.address && `· ${l.address}`}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                  {l.techs?.name && (
                    <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      Tech: {l.techs.name}
                    </div>
                  )}
                  {Number(l.amount) > 0 && (
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Amount: ${Number(l.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  )}
                  {l.follow_up_at && (
                    <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Call: {new Date(l.follow_up_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Select value={l.status} onValueChange={(v) => updateLead(l.id, { status: v }, `changed lead status to ${v}`)}>
                  <SelectTrigger className="glass-input h-8 w-32 text-xs font-semibold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="ghost" className="text-foreground hover:bg-foreground/5 h-8 w-8 p-0" onClick={() => setEditing(l)}>
                  <Edit className="h-4 w-4" />
                </Button>
                {role === "admin" && (
                  <Button size="sm" variant="ghost" className="text-rose-500 hover:bg-rose-500/10 h-8 w-8 p-0" onClick={() => deleteLead(l.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <div className="py-16 text-center text-muted-foreground">No leads found</div>}
      </div>

      {editing && (
        <EditLeadDialog lead={editing} techs={techs} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}

function EditLeadDialog({ lead, techs, onClose, onSaved }: { lead: any; techs: any[]; onClose: () => void; onSaved: () => void }) {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({ ...lead });
  const save = async () => {
    const { error } = await supabase.from("leads").update({
      customer_name: form.customer_name,
      customer_number: form.customer_number,
      service: form.service,
      address: form.address,
      area: form.area,
      context: form.context,
      notes: form.notes,
      customer_availability: form.customer_availability,
      amount: Number(form.amount) || 0,
      assigned_tech_id: form.assigned_tech_id || null,
      follow_up_at: form.follow_up_at || null,
      status: form.status,
    }).eq("id", lead.id);
    if (error) return toast.error(error.message);
    if (user) await logActivity({ user_id: user.id, user_name: profile?.name ?? "", action: "edited lead", entity_type: "lead", entity_id: lead.id, details: `Updated ${form.customer_name}` });
    toast.success("Saved");
    onSaved();
  };
  const f = (k: string) => (e: any) => setForm({ ...form, [k]: e.target?.value ?? e });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="glass-strong max-h-[90vh] overflow-y-auto text-foreground sm:max-w-lg">
        <DialogHeader><DialogTitle className="text-foreground">Edit lead</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-foreground/80 font-medium">Customer name</Label><Input className="glass-input" value={form.customer_name ?? ""} onChange={f("customer_name")} /></div>
            <div><Label className="text-foreground/80 font-medium">Number</Label><Input className="glass-input font-mono" value={form.customer_number ?? ""} onChange={f("customer_number")} /></div>
          </div>
          <div><Label className="text-foreground/80 font-medium">Service</Label><Input className="glass-input" value={form.service ?? ""} onChange={f("service")} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-foreground/80 font-medium">Area</Label><Input className="glass-input" value={form.area ?? ""} onChange={f("area")} /></div>
            <div><Label className="text-foreground/80 font-medium">Availability</Label><Input className="glass-input" value={form.customer_availability ?? ""} onChange={f("customer_availability")} /></div>
          </div>
          <div><Label className="text-foreground/80 font-medium">Address</Label><Input className="glass-input" value={form.address ?? ""} onChange={f("address")} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-foreground/80 font-medium">Amount ($)</Label><Input type="number" className="glass-input" value={form.amount ?? 0} onChange={f("amount")} /></div>
            <div><Label className="text-foreground/80 font-medium">Follow up</Label><Input type="datetime-local" className="glass-input" value={form.follow_up_at ? new Date(form.follow_up_at).toISOString().slice(0,16) : ""} onChange={f("follow_up_at")} /></div>
          </div>
          <div><Label className="text-foreground/80 font-medium">Assigned tech</Label>
            <Select value={form.assigned_tech_id ?? "none"} onValueChange={(v) => setForm({ ...form, assigned_tech_id: v === "none" ? null : v })}>
              <SelectTrigger className="glass-input"><SelectValue placeholder="Select tech" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {techs.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-foreground/80 font-medium">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className="glass-input"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-foreground/80 font-medium">Context</Label><Textarea className="glass-input min-h-20" value={form.context ?? ""} onChange={f("context")} /></div>
          <div><Label className="text-foreground/80 font-medium">Notes</Label><Textarea className="glass-input min-h-20" value={form.notes ?? ""} onChange={f("notes")} /></div>
          <Button onClick={save} className="w-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all mt-4">Save changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}