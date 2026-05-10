import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { AlertTriangle, FolderKanban, ShieldAlert, Upload, Sparkles, ArrowUpRight } from "lucide-react";
import { Panel, StatCard, Badge, PageHeader } from "@/components/raw/ui";
import { getDashboardStats, type DashboardStats } from "@/lib/api";

export const Route = createFileRoute("/")(
  {
    head: () => ({ meta: [{ title: "Operations Dashboard · RAW" }] }),
    component: Dashboard,
  }
);

const COLORS = [
  "oklch(0.7 0.18 240)", "oklch(0.85 0.16 200)", "oklch(0.78 0.18 75)",
  "oklch(0.78 0.17 155)", "oklch(0.65 0.24 22)", "oklch(0.7 0.15 300)",
];

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => console.error("Dashboard stats failed:", err))
      .finally(() => setLoading(false));
  }, []);

  // Generate chart data from stats or fallback
  const trafficData = Array.from({ length: 24 }, (_, i) => ({
    h: `${i}h`,
    events: 40 + Math.round(Math.sin(i / 2) * 30 + Math.random() * 25 + i * 1.5),
    threats: 5 + Math.round(Math.cos(i / 3) * 6 + Math.random() * 6),
  }));

  const evidenceMix = stats
    ? Object.entries(stats.evidence_by_type).map(([name, value], i) => ({
      name,
      value,
      color: COLORS[i % COLORS.length],
    }))
    : [
      { name: "Documents", value: 40, color: COLORS[0] },
      { name: "Images", value: 25, color: COLORS[1] },
      { name: "Video", value: 20, color: COLORS[2] },
      { name: "Audio", value: 15, color: COLORS[3] },
    ];

  const riskBars = [
    { d: "Low", r: stats?.low_risk_cases ?? 0 },
    { d: "Med", r: stats?.medium_risk_cases ?? 0 },
    { d: "High", r: stats?.high_risk_cases ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="OPERATIONS · TIER-IV"
        title="Investigation Command"
        desc="Real-time intelligence, AI-driven correlation, and forensic evidence surveillance across all open operations."
        actions={
          <>
            <Link to="/reports" className="px-3 py-2 rounded-md text-xs glass border border-border hover:border-accent/50">Export Brief</Link>
            <Link to="/copilot" className="px-3 py-2 rounded-md text-xs bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> AI Copilot
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Cases" value={loading ? "—" : stats?.open_cases ?? 0} delta={`${stats?.total_cases ?? 0} total`} icon={FolderKanban} />
        <StatCard label="Evidence Items" value={loading ? "—" : stats?.total_evidence ?? 0} delta={`${stats?.processing_evidence ?? 0} processing`} accent="cyan" icon={Upload} />
        <StatCard label="Timeline Events" value={loading ? "—" : stats?.total_events ?? 0} delta="all cases" accent="warn" icon={AlertTriangle} />
        <StatCard label="High Risk Cases" value={loading ? "—" : stats?.high_risk_cases ?? 0} delta={stats?.high_risk_cases ? "critical" : "none"} accent="destructive" icon={ShieldAlert} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel
          className="lg:col-span-2"
          title="Activity Overview · 24h"
          subtitle="EVENTS / THREATS · SIMULATED"
          right={<Badge tone="cyan">NEURAL CORE 4.2</Badge>}
        >
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.7 0.18 240)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.7 0.18 240)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.85 0.16 200)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.85 0.16 200)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.4 0.04 250 / 0.2)" vertical={false} />
                <XAxis dataKey="h" stroke="oklch(0.68 0.03 250)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.68 0.03 250)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.025 255)", border: "1px solid oklch(0.4 0.04 250 / 0.4)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="events" stroke="oklch(0.7 0.18 240)" strokeWidth={2} fill="url(#g1)" />
                <Area type="monotone" dataKey="threats" stroke="oklch(0.85 0.16 200)" strokeWidth={2} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Evidence Distribution" subtitle="BY TYPE">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={evidenceMix} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={3} stroke="none">
                  {evidenceMix.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.18 0.025 255)", border: "1px solid oklch(0.4 0.04 250 / 0.4)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {evidenceMix.map((e) => (
              <div key={e.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ background: e.color }} />
                <span className="text-muted-foreground capitalize">{e.name}</span>
                <span className="ml-auto ticker-mono">{e.value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Cases */}
        <Panel title="Recent Cases" subtitle="LATEST" className="lg:col-span-2">
          {stats?.recent_cases && stats.recent_cases.length > 0 ? (
            <ul className="space-y-2">
              {stats.recent_cases.map((c, i) => (
                <motion.li
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group rounded-lg border border-border/60 bg-secondary/20 hover:bg-secondary/40 transition p-3 flex gap-3"
                >
                  <div className={`mt-0.5 h-2 w-2 rounded-full ${c.risk_score > 70 ? "bg-destructive" : c.risk_score > 40 ? "bg-warn" : "bg-accent"} pulse-dot`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-medium">{c.title}</h4>
                      <Badge tone="cyan">{c.crime_type}</Badge>
                      <Badge tone={c.risk_score > 70 ? "destructive" : c.risk_score > 40 ? "warn" : "cyan"}>RISK {c.risk_score}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Created: {new Date(c.created_at).toLocaleDateString()} · Status: {c.status}</p>
                  </div>
                  <Link to="/cases/$id" params={{ id: c.id }}>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-accent" />
                  </Link>
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              {loading ? "Loading…" : "No cases yet. Create one from the Cases page."}
            </p>
          )}
        </Panel>

        <Panel title="Risk Distribution" subtitle="BY SEVERITY">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskBars}>
                <CartesianGrid stroke="oklch(0.4 0.04 250 / 0.2)" vertical={false} />
                <XAxis dataKey="d" stroke="oklch(0.68 0.03 250)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.68 0.03 250)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "oklch(0.7 0.18 240 / 0.1)" }} contentStyle={{ background: "oklch(0.18 0.025 255)", border: "1px solid oklch(0.4 0.04 250 / 0.4)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="r" radius={[4, 4, 0, 0]}>
                  {riskBars.map((d, i) => <Cell key={i} fill={d.d === "High" ? "oklch(0.65 0.24 22)" : d.d === "Med" ? "oklch(0.78 0.18 75)" : "oklch(0.7 0.18 240)"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}
