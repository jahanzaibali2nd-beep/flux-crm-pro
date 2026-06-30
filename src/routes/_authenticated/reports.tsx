import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/reports")({ component: ReportsPage });

function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [leads, setLeads] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
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
  }, [from, to]);

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
        <h1 className="text-3xl font-bold text-white">Reports</h1>
        <p className="text-sm text-white/60">Filter activity and lead totals by date range</p>
      </div>

      <Card className="glass border-white/10 p-4 text-white">
        <div className="flex flex-wrap gap-3">
          <div><Label className="text-white/80">From</Label><Input type="date" className="glass-input" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><Label className="text-white/80">To</Label><Input type="date" className="glass-input" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </div>
      </Card>

      <Tabs defaultValue="leads">
        <TabsList className="glass border-white/10 text-white">
          <TabsTrigger value="leads">Leads by user</TabsTrigger>
          <TabsTrigger value="activity">Activity logs</TabsTrigger>
        </TabsList>
        <TabsContent value="leads" className="mt-4">
          <Card className="glass border-white/10 p-4 text-white">
            <div className="mb-3 grid grid-cols-3 gap-3 border-b border-white/10 pb-2 text-xs font-medium text-white/60">
              <div>User</div><div>Leads added</div><div>Total $</div>
            </div>
            {Object.entries(byUser).map(([uid, v]) => (
              <div key={uid} className="grid grid-cols-3 gap-3 py-2 text-sm">
                <div>{v.name}</div><div>{v.count}</div><div>${v.amount.toFixed(2)}</div>
              </div>
            ))}
            {Object.keys(byUser).length === 0 && <div className="py-6 text-center text-white/50">No leads in range</div>}
          </Card>
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <Card className="glass border-white/10 p-4 text-white">
            <div className="space-y-2">
              {logs.map((l) => (
                <div key={l.id} className="flex items-start gap-3 border-b border-white/5 py-2 last:border-0">
                  <div className="text-xs text-white/40">{new Date(l.created_at).toLocaleString()}</div>
                  <div className="flex-1 text-sm">
                    <span className="font-medium text-white">{l.user_name ?? "Unknown"}</span>{" "}
                    <span className="text-white/70">{l.action}</span>
                    {l.details && <span className="text-white/50"> — {l.details}</span>}
                  </div>
                </div>
              ))}
              {logs.length === 0 && <div className="py-6 text-center text-white/50">No activity in range</div>}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}