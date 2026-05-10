import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck, UserCheck, FolderKanban, Loader2, AlertCircle, Activity,
  Brain, Trash2, RefreshCw, Download, FileText, BarChart3, Users, Clock,
  ShieldAlert, Database, Zap, Search, Eye
} from "lucide-react";
import {
  getUsers, listCases, updateUserRole, updateCase, getDashboardStats,
  listReports, deleteReport, getAuditLogs, getRiskScore,
  runEvidenceAgent, runAutopsyAgent,
  type UserOut, type CaseOut, type DashboardStats, type ReportOut
} from "@/lib/api";
import { Panel, Badge, StatCard, PageHeader } from "@/components/raw/ui";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";

export const Route = createFileRoute("/supervisor")({
  head: () => ({ meta: [{ title: "Supervisor Command · RAW" }] }),
  component: SupervisorPage,
});

const COLORS = [
  "oklch(0.7 0.18 240)", "oklch(0.85 0.16 200)", "oklch(0.78 0.18 75)",
  "oklch(0.78 0.17 155)", "oklch(0.65 0.24 22)", "oklch(0.7 0.15 300)"
];

function SupervisorPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "cases" | "reports" | "audit" | "ai">("overview");
  const [bulkAction, setBulkAction] = useState("");
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [aiRunning, setAiRunning] = useState<Record<string, boolean>>({});

  const { data: users, isLoading: loadingUsers, error: usersError } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    retry: false,
  });

  const { data: cases, isLoading: loadingCases } = useQuery({
    queryKey: ["cases"],
    queryFn: listCases,
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: getDashboardStats,
  });

  const { data: reports } = useQuery({
    queryKey: ["reports"],
    queryFn: () => listReports(),
  });

  useEffect(() => {
    getAuditLogs(100).then(setAuditLogs).catch(() => {});
  }, []);

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => updateUserRole(userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
    onError: (err: any) => setError(err.message),
  });

  const assignMutation = useMutation({
    mutationFn: ({ caseId, assigneeId }: { caseId: string; assigneeId: string }) =>
      updateCase(caseId, { assignee_id: assigneeId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cases"] }),
    onError: (err: any) => setError(err.message),
  });

  const handleBulkRisk = async () => {
    for (const caseId of selectedCases) {
      setAiRunning(p => ({ ...p, [caseId]: true }));
      try { await getRiskScore(caseId); } catch { }
      setAiRunning(p => ({ ...p, [caseId]: false }));
    }
    queryClient.invalidateQueries({ queryKey: ["cases"] });
    setSelectedCases(new Set());
  };

  const handleBulkEvidence = async () => {
    for (const caseId of selectedCases) {
      setAiRunning(p => ({ ...p, [`ev_${caseId}`]: true }));
      try { await runEvidenceAgent(caseId); } catch { }
      setAiRunning(p => ({ ...p, [`ev_${caseId}`]: false }));
    }
    setSelectedCases(new Set());
  };

  const toggleCase = (id: string) => {
    setSelectedCases(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  if (usersError) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">Supervisor clearance required. Login with rp@gmail.com</p>
      </div>
    );
  }

  // Chart data
  const evidenceMix = stats ? Object.entries(stats.evidence_by_type).map(([name, value], i) => ({
    name, value: value as number, color: COLORS[i % COLORS.length]
  })) : [];

  const riskBars = [
    { level: "Low", count: stats?.low_risk_cases ?? 0, fill: "oklch(0.7 0.18 240)" },
    { level: "Med", count: stats?.medium_risk_cases ?? 0, fill: "oklch(0.78 0.18 75)" },
    { level: "High", count: stats?.high_risk_cases ?? 0, fill: "oklch(0.65 0.24 22)" },
  ];

  const tabs = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "users", label: "Users", icon: Users },
    { key: "cases", label: "Cases", icon: FolderKanban },
    { key: "reports", label: "Reports", icon: FileText },
    { key: "audit", label: "Audit Log", icon: Eye },
    { key: "ai", label: "AI Agents", icon: Brain },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="COMMAND CENTER · LEVEL-V"
        title="Supervisor Dashboard"
        desc="Full system control — user management, case assignments, AI pipeline, audit logs, and forensic reports."
        actions={
          <Badge tone="destructive">ADMIN ACCESS</Badge>
        }
      />

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive border border-destructive/20 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
          <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-border/40 pb-0">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-xs font-medium rounded-t-lg flex items-center gap-1.5 border-b-2 transition-colors ${activeTab === t.key ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* === OVERVIEW TAB === */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={loadingUsers ? "—" : users?.length ?? 0} delta="registered" icon={Users} />
            <StatCard label="Active Cases" value={loadingStats ? "—" : stats?.open_cases ?? 0} delta={`${stats?.total_cases ?? 0} total`} accent="cyan" icon={FolderKanban} />
            <StatCard label="Evidence Items" value={loadingStats ? "—" : stats?.total_evidence ?? 0} delta={`${stats?.processing_evidence ?? 0} processing`} accent="warn" icon={Database} />
            <StatCard label="High Risk" value={loadingStats ? "—" : stats?.high_risk_cases ?? 0} delta="cases" accent="destructive" icon={ShieldAlert} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Evidence Distribution" subtitle="BY TYPE">
              <div className="h-[220px]">
                {evidenceMix.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={evidenceMix} dataKey="value" innerRadius={45} outerRadius={80} stroke="none">
                        {evidenceMix.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No evidence data</div>
                )}
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                {evidenceMix.map(e => (
                  <div key={e.name} className="flex items-center gap-1.5 text-xs">
                    <span className="h-2 w-2 rounded-full" style={{ background: e.color }} />
                    <span className="capitalize">{e.name}: {e.value}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Risk Distribution" subtitle="SEVERITY BREAKDOWN">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskBars}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                    <XAxis dataKey="level" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {riskBars.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* === USERS TAB === */}
      {activeTab === "users" && (
        <div className="animate-in fade-in duration-300">
          <Panel title="Investigator Management" subtitle={`${users?.length ?? 0} REGISTERED`} right={
            <Badge tone="cyan">{users?.filter(u => u.role === "admin").length ?? 0} Admins</Badge>
          }>
            {loadingUsers ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-muted-foreground border-b border-border/40">
                    <tr>
                      <th className="text-left py-3 px-2">Name</th>
                      <th className="text-left py-3 px-2">Email</th>
                      <th className="text-left py-3 px-2">Role</th>
                      <th className="text-left py-3 px-2">MFA</th>
                      <th className="text-left py-3 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {users?.map(user => (
                      <tr key={user.id} className="hover:bg-secondary/20">
                        <td className="py-3 px-2 font-medium">{user.name}</td>
                        <td className="py-3 px-2 text-muted-foreground">{user.email}</td>
                        <td className="py-3 px-2">
                          <select
                            className="bg-background border border-border rounded text-xs p-1.5"
                            value={user.role}
                            onChange={(e) => roleMutation.mutate({ userId: user.id, role: e.target.value })}
                          >
                            <option value="officer">Officer</option>
                            <option value="investigator">Investigator</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3 px-2">
                          <Badge tone={user.email === "rp@gmail.com" ? "success" : "default"}>
                            {user.email === "rp@gmail.com" ? "SUPERVISOR" : "Standard"}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <Badge tone={user.role === "admin" ? "destructive" : "cyan"}>{user.role.toUpperCase()}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* === CASES TAB === */}
      {activeTab === "cases" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Bulk Actions Bar */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/40">
            <span className="text-xs text-muted-foreground">{selectedCases.size} selected</span>
            <button onClick={handleBulkRisk} disabled={selectedCases.size === 0}
              className="px-3 py-1.5 text-xs rounded-md bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-30 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" /> Bulk Risk Analysis
            </button>
            <button onClick={handleBulkEvidence} disabled={selectedCases.size === 0}
              className="px-3 py-1.5 text-xs rounded-md bg-accent/20 text-accent hover:bg-accent/30 disabled:opacity-30 flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5" /> Bulk Evidence Analysis
            </button>
            <button onClick={() => setSelectedCases(new Set(cases?.map(c => c.id) || []))}
              className="px-3 py-1.5 text-xs rounded-md bg-secondary/50 text-foreground hover:bg-secondary flex items-center gap-1.5 ml-auto">
              Select All
            </button>
          </div>

          <Panel title="All Cases" subtitle={`${cases?.length ?? 0} TOTAL`}>
            {loadingCases ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-muted-foreground border-b border-border/40">
                    <tr>
                      <th className="py-3 px-2 w-8"><input type="checkbox" onChange={e => {
                        if (e.target.checked) setSelectedCases(new Set(cases?.map(c => c.id)));
                        else setSelectedCases(new Set());
                      }} /></th>
                      <th className="text-left py-3 px-2">Case</th>
                      <th className="text-left py-3 px-2">Type</th>
                      <th className="text-left py-3 px-2">Risk</th>
                      <th className="text-left py-3 px-2">Status</th>
                      <th className="text-left py-3 px-2">Assigned To</th>
                      <th className="text-left py-3 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {cases?.map(c => (
                      <tr key={c.id} className={`hover:bg-secondary/20 ${selectedCases.has(c.id) ? "bg-primary/5" : ""}`}>
                        <td className="py-3 px-2">
                          <input type="checkbox" checked={selectedCases.has(c.id)} onChange={() => toggleCase(c.id)} />
                        </td>
                        <td className="py-3 px-2">
                          <Link to="/cases/$id" params={{ id: c.id }} className="font-medium hover:text-primary">{c.title}</Link>
                        </td>
                        <td className="py-3 px-2"><Badge tone="cyan">{c.crime_type}</Badge></td>
                        <td className="py-3 px-2">
                          <Badge tone={c.risk_score > 70 ? "destructive" : c.risk_score > 40 ? "warn" : "success"}>
                            {c.risk_score}
                          </Badge>
                          {aiRunning[c.id] && <Loader2 className="h-3 w-3 animate-spin inline ml-1" />}
                        </td>
                        <td className="py-3 px-2">
                          <Badge tone={c.status === "open" ? "success" : "default"}>{c.status.toUpperCase()}</Badge>
                        </td>
                        <td className="py-3 px-2">
                          <select
                            className="bg-background border border-border rounded text-xs p-1.5 w-full"
                            value={c.assignee_id || ""}
                            onChange={(e) => assignMutation.mutate({ caseId: c.id, assigneeId: e.target.value })}
                          >
                            <option value="">-- Unassigned --</option>
                            {users?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex gap-1">
                            <Link to="/cases/$id/report" params={{ id: c.id }}
                              className="px-2 py-1 text-[10px] rounded bg-accent/20 text-accent hover:bg-accent/30">
                              PDF
                            </Link>
                            <Link to="/cases/$id" params={{ id: c.id }}
                              className="px-2 py-1 text-[10px] rounded bg-primary/20 text-primary hover:bg-primary/30">
                              Open
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* === REPORTS TAB === */}
      {activeTab === "reports" && (
        <div className="animate-in fade-in duration-300">
          <Panel title="Generated Reports" subtitle={`${reports?.length ?? 0} REPORTS`}>
            {!reports || reports.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No reports generated yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-muted-foreground border-b border-border/40">
                    <tr>
                      <th className="text-left py-3 px-2">Title</th>
                      <th className="text-left py-3 px-2">Type</th>
                      <th className="text-left py-3 px-2">Status</th>
                      <th className="text-left py-3 px-2">Pages</th>
                      <th className="text-left py-3 px-2">Created</th>
                      <th className="text-left py-3 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {reports.map(r => (
                      <tr key={r.id} className="hover:bg-secondary/20">
                        <td className="py-3 px-2 font-medium">{r.title}</td>
                        <td className="py-3 px-2"><Badge tone="cyan">{r.report_type}</Badge></td>
                        <td className="py-3 px-2">
                          <Badge tone={r.status === "complete" ? "success" : r.status === "generating" ? "warn" : "destructive"}>
                            {r.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 ticker-mono">{r.pages}</td>
                        <td className="py-3 px-2 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-2">
                          <Link to="/cases/$id/report" params={{ id: r.case_id }}
                            className="px-2 py-1 text-[10px] rounded bg-accent text-accent-foreground hover:opacity-90">
                            View Brief
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* === AUDIT LOG TAB === */}
      {activeTab === "audit" && (
        <div className="animate-in fade-in duration-300">
          <Panel title="System Audit Trail" subtitle="LAST 100 ACTIONS" right={
            <button onClick={() => getAuditLogs(100).then(setAuditLogs)} className="px-3 py-1.5 text-xs rounded-md bg-secondary/50 hover:bg-secondary flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          }>
            {auditLogs.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No audit logs recorded yet.</p>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-muted-foreground border-b border-border/40 sticky top-0 bg-background">
                    <tr>
                      <th className="text-left py-3 px-2">Timestamp</th>
                      <th className="text-left py-3 px-2">Method</th>
                      <th className="text-left py-3 px-2">Path</th>
                      <th className="text-left py-3 px-2">Status</th>
                      <th className="text-left py-3 px-2">User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {auditLogs.map((log, i) => (
                      <tr key={i} className="hover:bg-secondary/20 text-xs">
                        <td className="py-2 px-2 ticker-mono text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="py-2 px-2"><Badge>{log.method}</Badge></td>
                        <td className="py-2 px-2 font-mono text-muted-foreground truncate max-w-[250px]">{log.path}</td>
                        <td className="py-2 px-2">
                          <Badge tone={log.status_code < 400 ? "success" : "destructive"}>{log.status_code}</Badge>
                        </td>
                        <td className="py-2 px-2 text-muted-foreground">{log.user_id ? `${String(log.user_id).slice(-6)}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* === AI AGENTS TAB === */}
      {activeTab === "ai" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Evidence Agent", desc: "Summarize & classify all evidence", icon: Search, color: "primary" },
              { name: "Autopsy Agent", desc: "Extract forensic findings from reports", icon: Brain, color: "accent" },
              { name: "Risk Scoring", desc: "Calculate risk score + anomaly detection", icon: ShieldAlert, color: "destructive" },
              { name: "Timeline Agent", desc: "Reconstruct case event timeline", icon: Clock, color: "warn" },
              { name: "Graph Agent", desc: "Analyze relationship networks", icon: Zap, color: "cyan" },
              { name: "Face Sketch", desc: "Generate suspect composite from witness data", icon: Users, color: "primary" },
            ].map(agent => (
              <div key={agent.name} className="glass-strong rounded-xl border border-border/60 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`h-10 w-10 rounded-lg grid place-items-center bg-${agent.color}/10 text-${agent.color}`}>
                    <agent.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{agent.name}</h3>
                    <p className="text-[11px] text-muted-foreground">{agent.desc}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge tone="success">ONLINE</Badge>
                  <span className="text-[10px] text-muted-foreground">Trigger from Case Detail</span>
                </div>
              </div>
            ))}
          </div>

          <Panel title="Pipeline Status" subtitle="CELERY WORKERS">
            <div className="grid grid-cols-3 gap-4 text-center py-4">
              <div>
                <div className="text-2xl font-bold">{stats?.processing_evidence ?? 0}</div>
                <div className="text-xs text-muted-foreground">Processing</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent">{stats?.total_evidence ?? 0}</div>
                <div className="text-xs text-muted-foreground">Total Evidence</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{stats?.total_events ?? 0}</div>
                <div className="text-xs text-muted-foreground">Timeline Events</div>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
