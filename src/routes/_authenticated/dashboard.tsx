import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/auth-provider";
import { LeadFormDialog } from "@/components/LeadFormDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, DollarSign, Users, TrendingUp, Calendar, Clock, ChevronRight, Activity } from "lucide-react";
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
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [usersList, setUsersList] = useState<any[]>([]);
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [progress, setProgress] = useState({ 
    daily: { leads: 0, amount: 0 }, 
    weekly: { leads: 0, amount: 0 }, 
    monthly: { leads: 0, amount: 0 } 
  });
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Set default selectedUserId once user is loaded
  useEffect(() => {
    if (user && !selectedUserId) {
      setSelectedUserId(user.id);
    }
  }, [user, selectedUserId]);

  // Fetch users list for admin target selection
  useEffect(() => {
    if (user && role === "admin") {
      supabase.from("profiles")
        .select("user_id, name")
        .eq("active", true)
        .order("name")
        .then(({ data }) => {
          setUsersList(data ?? []);
        });
    }
  }, [user, role]);

  // Fetch stats, targets, recent leads, and followups
  useEffect(() => {
    if (!user || !selectedUserId) return;
    (async () => {
      // 1. Fetch targets for selectedUserId
      const { data: t } = await supabase.from("targets").select("*").eq("user_id", selectedUserId);
      const map: Record<string, number> = {};
      (t ?? []).forEach((r: any) => { map[`${r.target_type}_${r.period}`] = Number(r.value); });
      setTargets(map);

      // 2. Fetch progress stats for selectedUserId
      const periods: Period[] = ["daily", "weekly", "monthly"];
      const next: any = { daily: {}, weekly: {}, monthly: {} };
      for (const p of periods) {
        const since = periodStart(p).toISOString();
        let q = supabase.from("leads")
          .select("amount", { count: "exact" })
          .gte("created_at", since)
          .eq("created_by", selectedUserId);
        const { data, count } = await q;
        next[p].leads = count ?? 0;
        next[p].amount = (data ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
      }
      setProgress(next);

      // 3. Fetch recent leads (based on role - admins see all, marketers see own)
      let qRecent = supabase.from("leads")
        .select("*, techs(name)")
        .order("created_at", { ascending: false })
        .limit(5);
      if (role !== "admin") qRecent = qRecent.eq("created_by", user.id);
      const { data: rl } = await qRecent;
      setRecentLeads(rl ?? []);

      // 4. Fetch upcoming followups
      let qFollow = supabase.from("leads")
        .select("id, customer_name, customer_number, service, follow_up_at, status")
        .not("follow_up_at", "is", null)
        .not("status", "in", '("won","lost")')
        .order("follow_up_at", { ascending: true })
        .limit(5);
      if (role !== "admin") qFollow = qFollow.eq("created_by", user.id);
      const { data: fu } = await qFollow;
      setFollowUps(fu ?? []);
    })();
  }, [user, role, selectedUserId, refreshKey]);

  const saveTarget = async (type: TType, period: Period, value: number) => {
    if (!user || !selectedUserId) return;
    const { error } = await supabase.from("targets").upsert(
      { user_id: selectedUserId, target_type: type, period, value },
      { onConflict: "user_id,target_type,period" },
    );
    if (error) toast.error(error.message);
    else {
      toast.success("Target saved");
      setTargets({ ...targets, [`${type}_${period}`]: value });
    }
  };

  const stats: Array<{ label: string; period: Period; type: TType; icon: any; suffix?: string; prefix?: string }> = [
    { label: "Daily Leads", period: "daily", type: "leads", icon: Users },
    { label: "Weekly Leads", period: "weekly", type: "leads", icon: Users },
    { label: "Monthly Leads", period: "monthly", type: "leads", icon: TrendingUp },
    { label: "Daily Revenue", period: "daily", type: "amount", icon: DollarSign, prefix: "$" },
    { label: "Weekly Revenue", period: "weekly", type: "amount", icon: DollarSign, prefix: "$" },
    { label: "Monthly Revenue", period: "monthly", type: "amount", icon: DollarSign, prefix: "$" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar with title and user selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-white/60 mt-1">Track targets and capture leads in real time</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {role === "admin" && usersList.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50 font-medium uppercase tracking-wider">Viewing:</span>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="glass-input h-9 w-48 text-xs font-semibold text-white">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {usersList.map((u) => (
                    <SelectItem key={u.user_id} value={u.user_id} className="text-xs">
                      {u.name} {u.user_id === user?.id ? "(You)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <LeadFormDialog onCreated={() => setRefreshKey((k) => k + 1)} />
        </div>
      </div>

      {/* Targets Progress Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => {
          const key = `${s.type}_${s.period}`;
          const target = targets[key] ?? 0;
          const current = progress[s.period]?.[s.type] ?? 0;
          const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
          return (
            <Card key={key} className="glass p-5 text-white flex flex-col justify-between hover:scale-[1.02] transition-all">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-white/70 font-medium">{s.label}</span>
                  <s.icon className="h-4 w-4 text-white/40" />
                </div>
                <div className="mb-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight">
                    {s.prefix}{s.type === "amount" ? current.toLocaleString(undefined, { maximumFractionDigits: 0 }) : current}
                  </span>
                  <span className="text-xs text-white/40">
                    / {s.prefix}{target.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5 mt-2">
                <Progress value={pct} className="h-1.5 bg-white/10" />
                <div className="flex justify-between text-xs text-white/50">
                  <span>Progress</span>
                  <span className="font-semibold">{pct.toFixed(0)}%</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Leads and Upcoming Follow-ups Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Leads Panel */}
        <Card className="glass p-6 text-white hover:border-white/15 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold tracking-tight">Recent Leads</h2>
            </div>
            <Link to="/leads" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentLeads.map((l) => (
              <div key={l.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all">
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{l.customer_name}</div>
                  <div className="text-xs text-white/50 mt-0.5 truncate">{l.service} · {l.area || "No area"}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {Number(l.amount) > 0 && (
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      ${Number(l.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  )}
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-white/80">
                    {l.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
            {recentLeads.length === 0 && (
              <div className="py-12 text-center text-sm text-white/40">
                No leads recorded yet. Click "New Lead" to add one.
              </div>
            )}
          </div>
        </Card>

        {/* Upcoming Followups Panel */}
        <Card className="glass p-6 text-white hover:border-white/15 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-bold tracking-tight">Upcoming Follow-ups</h2>
            </div>
            <Link to="/leads" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
              Manage leads <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {followUps.map((l) => {
              const date = new Date(l.follow_up_at);
              const isOverdue = date < new Date();
              return (
                <div key={l.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{l.customer_name}</div>
                    <div className="text-xs text-white/50 mt-0.5 truncate">{l.service} · {l.customer_number}</div>
                  </div>
                  <div className="text-right flex-shrink-0 pl-2">
                    <div className={`text-xs font-bold flex items-center gap-1 justify-end ${isOverdue ? "text-rose-400 animate-pulse" : "text-emerald-400"}`}>
                      <Clock className="h-3 w-3" />
                      {date.toLocaleDateString([], { month: "short", day: "numeric" })} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {isOverdue && (
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-rose-500 mt-0.5 block">
                        Overdue Call
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {followUps.length === 0 && (
              <div className="py-12 text-center text-sm text-white/40">
                No scheduled follow-ups. Schedule one by editing a lead.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Target Settings */}
      <Card className="glass p-6 text-white">
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight">Set Target Benchmarks</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <div key={p} className="glass rounded-xl p-4 border-white/5">
              <div className="mb-3 text-sm font-semibold capitalize text-white/80 border-b border-white/5 pb-1">{p} targets</div>
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
      <Label className="text-xs text-white/50 capitalize font-medium">{type === "amount" ? "Revenue ($)" : "Leads Target"}</Label>
      <div className="mt-1 flex gap-2">
        <Input type="number" className="glass-input h-8 text-sm" value={v} onChange={(e) => setV(e.target.value)} />
        <Button size="sm" onClick={() => onSave(type, period, Number(v) || 0)} className="h-8 bg-white/10 text-white hover:bg-white/20 px-3 font-semibold text-xs transition-all">Save</Button>
      </div>
    </div>
  );
}