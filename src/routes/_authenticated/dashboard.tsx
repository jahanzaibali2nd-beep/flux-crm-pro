import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/auth-provider";
import { LeadFormDialog } from "@/components/LeadFormDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Target, DollarSign, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

type Period = "daily" | "weekly" | "monthly";
type TType = "leads" | "amount";

function periodStart(p: Period): Date {
  const now = new Date();
  if (p === "daily") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (p === "weekly") {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function Dashboard() {
  const { user, role } = useAuth();
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [progress, setProgress] = useState({ daily: { leads: 0, amount: 0 }, weekly: { leads: 0, amount: 0 }, monthly: { leads: 0, amount: 0 } });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: t } = await supabase.from("targets").select("*").eq("user_id", user.id);
      const map: Record<string, number> = {};
      (t ?? []).forEach((r: any) => { map[`${r.target_type}_${r.period}`] = Number(r.value); });
      setTargets(map);

      const periods: Period[] = ["daily", "weekly", "monthly"];
      const next: any = { daily: {}, weekly: {}, monthly: {} };
      for (const p of periods) {
        const since = periodStart(p).toISOString();
        let q = supabase.from("leads").select("amount,created_by", { count: "exact" }).gte("created_at", since);
        if (role !== "admin") q = q.eq("created_by", user.id);
        const { data, count } = await q;
        next[p].leads = count ?? 0;
        next[p].amount = (data ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
      }
      setProgress(next);
    })();
  }, [user, role, refreshKey]);

  const saveTarget = async (type: TType, period: Period, value: number) => {
    if (!user) return;
    const { error } = await supabase.from("targets").upsert(
      { user_id: user.id, target_type: type, period, value },
      { onConflict: "user_id,target_type,period" },
    );
    if (error) toast.error(error.message);
    else {
      toast.success("Target saved");
      setTargets({ ...targets, [`${type}_${period}`]: value });
    }
  };

  const stats: Array<{ label: string; period: Period; type: TType; icon: any; suffix?: string; prefix?: string }> = [
    { label: "Daily leads", period: "daily", type: "leads", icon: Users },
    { label: "Weekly leads", period: "weekly", type: "leads", icon: Users },
    { label: "Monthly leads", period: "monthly", type: "leads", icon: TrendingUp },
    { label: "Daily revenue", period: "daily", type: "amount", icon: DollarSign, prefix: "$" },
    { label: "Weekly revenue", period: "weekly", type: "amount", icon: DollarSign, prefix: "$" },
    { label: "Monthly revenue", period: "monthly", type: "amount", icon: DollarSign, prefix: "$" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-white/60">Track targets and capture leads in real time</p>
        </div>
        <LeadFormDialog onCreated={() => setRefreshKey((k) => k + 1)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => {
          const key = `${s.type}_${s.period}`;
          const target = targets[key] ?? 0;
          const current = progress[s.period][s.type];
          const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
          return (
            <Card key={key} className="glass border-white/10 p-5 text-white">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-white/70">{s.label}</span>
                <s.icon className="h-4 w-4 text-white/50" />
              </div>
              <div className="mb-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {s.prefix}{s.type === "amount" ? current.toFixed(0) : current}
                </span>
                <span className="text-xs text-white/50">
                  / {s.prefix}{target}
                </span>
              </div>
              <Progress value={pct} className="h-1.5 bg-white/10" />
              <div className="mt-3 text-xs text-white/60">{pct.toFixed(0)}% of target</div>
            </Card>
          );
        })}
      </div>

      <Card className="glass border-white/10 p-6 text-white">
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Set your targets</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <div key={p} className="glass rounded-lg border-white/10 p-4">
              <div className="mb-3 text-sm font-medium capitalize text-white/80">{p}</div>
              {(["leads", "amount"] as TType[]).map((type) => (
                <TargetRow key={type} type={type} period={p} value={targets[`${type}_${p}`] ?? 0} onSave={saveTarget} />
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function TargetRow({ type, period, value, onSave }: { type: TType; period: Period; value: number; onSave: (t: TType, p: Period, v: number) => void }) {
  const [v, setV] = useState(String(value));
  useEffect(() => setV(String(value)), [value]);
  return (
    <div className="mb-3 last:mb-0">
      <Label className="text-xs text-white/60 capitalize">{type === "amount" ? "Revenue ($)" : "Leads"}</Label>
      <div className="mt-1 flex gap-2">
        <Input type="number" className="glass-input h-8" value={v} onChange={(e) => setV(e.target.value)} />
        <Button size="sm" onClick={() => onSave(type, period, Number(v) || 0)} className="h-8 bg-white/15 text-white hover:bg-white/25">Save</Button>
      </div>
    </div>
  );
}