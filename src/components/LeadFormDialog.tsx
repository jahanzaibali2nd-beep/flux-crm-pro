import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/auth-provider";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity";

export function LeadFormDialog({ onCreated, trigger }: { onCreated?: () => void; trigger?: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [techs, setTechs] = useState<any[]>([]);
  const [form, setForm] = useState({
    customer_name: "",
    customer_number: "",
    service: "",
    address: "",
    area: "",
    context: "",
    notes: "",
    customer_availability: "",
    amount: "",
    assigned_tech_id: "none",
  });

  useEffect(() => {
    if (open) {
      supabase.from("techs").select("id,name").eq("active", true).then(({ data }) => setTechs(data ?? []));
    }
  }, [open]);

  const reset = () => setForm({
    customer_name: "", customer_number: "", service: "", address: "",
    area: "", context: "", notes: "", customer_availability: "",
    amount: "", assigned_tech_id: "none",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      const payload = {
        customer_name: form.customer_name,
        customer_number: form.customer_number,
        service: form.service,
        address: form.address,
        area: form.area,
        context: form.context,
        notes: form.notes,
        customer_availability: form.customer_availability,
        amount: Number(form.amount) || 0,
        assigned_tech_id: form.assigned_tech_id === "none" ? null : form.assigned_tech_id,
        created_by: user.id,
      };

      const { error, data } = await supabase.from("leads").insert(payload).select().single();
      if (error) throw new Error(error.message);
      
      await logActivity({
        user_id: user.id,
        user_name: profile?.name ?? "Unknown",
        action: "created lead",
        entity_type: "lead",
        entity_id: data.id,
        details: `Added lead for ${form.customer_name} (${form.service}) - Amount: $${payload.amount}`,
      });
      
      toast.success("Lead created");
      reset();
      setOpen(false);
      onCreated?.();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const f = (k: keyof typeof form) => (e: any) => setForm({ ...form, [k]: e.target?.value ?? e });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-primary text-primary-foreground hover:opacity-90 transition-all">
            <Plus className="mr-2 h-4 w-4" /> New Lead
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="glass-strong max-h-[90vh] overflow-y-auto text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Add new lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-white/85 font-medium">Customer name *</Label>
              <Input required className="glass-input" value={form.customer_name} onChange={f("customer_name")} /></div>
            <div><Label className="text-white/85 font-medium">Customer number *</Label>
              <Input required className="glass-input" value={form.customer_number} onChange={f("customer_number")} /></div>
          </div>
          <div><Label className="text-white/85 font-medium">Service *</Label>
            <Input required className="glass-input" value={form.service} onChange={f("service")} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-white/85 font-medium">Area</Label>
              <Input className="glass-input" value={form.area} onChange={f("area")} /></div>
            <div><Label className="text-white/85 font-medium">Availability</Label>
              <Input className="glass-input" value={form.customer_availability} onChange={f("customer_availability")} placeholder="e.g. Weekdays 9-5" /></div>
          </div>
          <div><Label className="text-white/85 font-medium">Address</Label>
            <Input className="glass-input" value={form.address} onChange={f("address")} /></div>
          
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-white/85 font-medium">Amount ($)</Label>
              <Input type="number" className="glass-input" value={form.amount} onChange={f("amount")} placeholder="0.00" /></div>
            <div><Label className="text-white/85 font-medium">Assigned technician</Label>
              <Select value={form.assigned_tech_id} onValueChange={f("assigned_tech_id")}>
                <SelectTrigger className="glass-input text-white"><SelectValue placeholder="Select tech" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {techs.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div><Label className="text-white/85 font-medium">Context</Label>
            <Textarea className="glass-input min-h-20" value={form.context} onChange={f("context")} /></div>
          <div><Label className="text-white/85 font-medium">Notes</Label>
            <Textarea className="glass-input min-h-20" value={form.notes} onChange={f("notes")} /></div>
          
          <Button type="submit" disabled={busy} className="w-full bg-primary text-primary-foreground hover:opacity-90 transition-all font-semibold mt-4">
            {busy ? "Saving..." : "Create lead"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}