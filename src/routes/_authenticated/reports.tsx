import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/auth-provider";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/reports")({ component: ReportsPage });

function ReportsPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [leads, setLeads] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    if (role && role !== "admin") {
      navigate({ to: "/dashboard" });
      return;
    }
    (async () => {
      const start = new Date(from + "T00:00:00").toISOString();
      const end = new Date(to + "T23:59:59").toISOString();
      const { data: ls } = await supabase.from("leads").select("*").gte("created_at", start).lte("created_at", end);
      const { data: lg } = await supabase.from("activity_logs").select("*").gte("created_at", start).lte("created_at", end).order("created_at", { ascending: false }).limit(500);
      const { data: ps } = await supabase.from("profiles").select("user_id,name,email");
      setLeads(ls ?? []);
      setLogs(lg ?? []);
      const m: Record<string, any> = {};
      (ps ?? []).forEach((p: any) => { m[p.user_id] = p; });
      setProfiles(m);
    })();
  }, [from, to, role, navigate]);

  const byUser: Record<string, { count: number; amount: number; name: string }> = {};
  leads.forEach((l) => {
    const uid = l.created_by;
    const name = profiles[uid]?.name ?? "Unknown";
    if (!byUser[uid]) byUser[uid] = { count: 0, amount: 0, name };
    byUser[uid].count++;
    byUser[uid].amount += Number(l.amount ?? 0);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Filter activity and lead totals by date range</p>
      </div>

      <Card className="glass p-4 text-foreground">
        <div className="flex flex-wrap gap-3">
          <div><Label className="text-foreground/80 font-medium">From</Label><Input type="date" className="glass-input mt-1" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><Label className="text-foreground/80 font-medium">To</Label><Input type="date" className="glass-input mt-1" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </div>
      </Card>

      <Tabs defaultValue="leads">
        <TabsList className="glass text-foreground bg-foreground/[0.02]">
          <TabsTrigger value="leads" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Leads by user</TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Activity logs</TabsTrigger>
        </TabsList>
        <TabsContent value="leads" className="mt-4">
          <Card className="glass p-5 text-foreground">
            <div className="mb-3 grid grid-cols-3 gap-3 border-b border-border/10 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <div>User</div><div>Leads added</div><div>Total amount</div>
            </div>
            {Object.entries(byUser).map(([uid, v]) => (
              <div key={uid} className="grid grid-cols-3 gap-3 py-2.5 text-sm border-b border-border/5 last:border-0 items-center">
                <div className="font-semibold text-foreground/90">{v.name}</div>
                <div>{v.count}</div>
                <div className="font-semibold text-emerald-600 dark:text-emerald-400">${v.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            ))}
            {Object.keys(byUser).length === 0 && <div className="py-12 text-center text-muted-foreground">No leads in range</div>}
          </Card>
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <Card className="glass p-5 text-foreground">
            <div className="space-y-1">
              {logs.map((l) => (
                <div key={l.id} className="flex items-start gap-3 border-b border-border/5 py-3 last:border-0">
                  <div className="text-xs text-muted-foreground/80 font-mono mt-0.5">{new Date(l.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                  <div className="flex-1 text-sm">
                    <span className="font-bold text-foreground/90">{l.user_name ?? "Unknown"}</span>{" "}
                    <span className="text-foreground/80">{l.action}</span>
                    {l.details && <span className="text-muted-foreground font-medium"> — {l.details}</span>}
                  </div>
                </div>
              ))}
              {logs.length === 0 && <div className="py-12 text-center text-muted-foreground">No activity logs recorded in range</div>}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}