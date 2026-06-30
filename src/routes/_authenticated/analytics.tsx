import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/auth-provider";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";

export const Route = createFileRoute("/_authenticated/analytics")({ component: AnalyticsPage });

const COLORS = ["#a78bfa", "#22d3ee", "#f472b6", "#fbbf24", "#34d399", "#f87171", "#60a5fa"];

function AnalyticsPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    if (role && role !== "admin") {
      navigate({ to: "/dashboard" });
      return;
    }
    supabase.from("leads").select("*").order("created_at").then(({ data }) => setLeads(data ?? []));
  }, [role, navigate]);

  const byDay: Record<string, { date: string; count: number; amount: number }> = {};
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    byDay[key] = { date: key.slice(5), count: 0, amount: 0 };
  }
  leads.forEach((l) => {
    const key = l.created_at.slice(0, 10);
    if (byDay[key]) { byDay[key].count++; byDay[key].amount += Number(l.amount ?? 0); }
  });
  const trendData = Object.values(byDay);

  const statusCounts: Record<string, number> = {};
  leads.forEach((l) => { statusCounts[l.status] = (statusCounts[l.status] ?? 0) + 1; });
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const serviceCounts: Record<string, number> = {};
  leads.forEach((l) => { serviceCounts[l.service] = (serviceCounts[l.service] ?? 0) + 1; });
  const services = Object.entries(serviceCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-white/60">Trends across last 30 days</p>
      </div>

      <Card className="glass border-white/10 p-4 text-white">
        <h2 className="mb-3 text-sm font-semibold">Leads per day</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trendData}>
            <XAxis dataKey="date" stroke="#ffffff60" fontSize={11} />
            <YAxis stroke="#ffffff60" fontSize={11} />
            <Tooltip contentStyle={{ background: "rgba(20,20,40,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
            <Line type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass border-white/10 p-4 text-white">
          <h2 className="mb-3 text-sm font-semibold">Status breakdown</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend wrapperStyle={{ color: "#fff", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass border-white/10 p-4 text-white">
          <h2 className="mb-3 text-sm font-semibold">Top services</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={services}>
              <XAxis dataKey="name" stroke="#ffffff60" fontSize={11} />
              <YAxis stroke="#ffffff60" fontSize={11} />
              <Tooltip contentStyle={{ background: "rgba(20,20,40,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
              <Bar dataKey="count" fill="#22d3ee" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="glass border-white/10 p-4 text-white">
        <h2 className="mb-3 text-sm font-semibold">Revenue per day</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={trendData}>
            <XAxis dataKey="date" stroke="#ffffff60" fontSize={11} />
            <YAxis stroke="#ffffff60" fontSize={11} />
            <Tooltip contentStyle={{ background: "rgba(20,20,40,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
            <Bar dataKey="amount" fill="#f472b6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}