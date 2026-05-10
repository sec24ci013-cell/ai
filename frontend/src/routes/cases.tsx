import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Users, FileSearch, AlertTriangle, Plus, X } from "lucide-react";
import { PageHeader, Badge } from "@/components/raw/ui";
import { listCases, createCase, type CaseOut } from "@/lib/api";

export const Route = createFileRoute("/cases")({
  head: () => ({ meta: [{ title: "Active Cases · RAW" }] }),
  component: Cases,
});

function Cases() {
  const [cases, setCases] = useState<CaseOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("");
  const [creating, setCreating] = useState(false);

  const loadCases = async () => {
    try {
      const data = await listCases();
      setCases(data);
    } catch (err) {
      console.error("Failed to load cases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCases(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newType.trim()) return;
    setCreating(true);
    try {
      await createCase(newTitle, newType);
      setNewTitle("");
      setNewType("");
      setShowCreate(false);
      loadCases();
    } catch (err) {
      console.error("Failed to create case:", err);
    } finally {
      setCreating(false);
    }
  };

  const riskTone = (score: number) =>
    score > 70 ? "destructive" : score > 40 ? "warn" : "cyan";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ACTIVE OPERATIONS"
        title="Investigation Registry"
        desc="All currently open cases ranked by AI-computed risk index. Click into any case for the full forensic workstation."
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-2 rounded-md text-xs bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> New Case
          </button>
        }
      />

      {/* Create Case Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass-strong rounded-xl border border-border p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create New Case</h3>
                <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Case Title</label>
                  <input
                    type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                    required
                    className="w-full h-11 px-3 rounded-lg bg-secondary/40 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Operation Nightglass"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Crime Type</label>
                  <select
                    value={newType} onChange={(e) => setNewType(e.target.value)}
                    required
                    className="w-full h-11 px-3 rounded-lg bg-secondary/40 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                  >
                    <option value="" disabled>Select a crime type...</option>
                    <option value="Cyber">Cyber</option>
                    <option value="Financial">Financial</option>
                    <option value="Homicide">Homicide</option>
                    <option value="Narcotics">Narcotics</option>
                    <option value="Organized Crime">Organized Crime</option>
                    <option value="Fraud">Fraud</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <button
                  type="submit" disabled={creating}
                  className="w-full h-11 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {creating ? "Creating…" : "Initialize Case"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground text-sm flex items-center gap-3">
            <span className="h-5 w-5 border-2 border-muted-foreground/40 border-t-accent rounded-full animate-spin" />
            Loading case registry…
          </div>
        </div>
      ) : cases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-muted-foreground text-sm">No cases in the system.</div>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 px-4 py-2 rounded-md text-xs bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Create First Case
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {cases.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="group glass rounded-xl border border-border/60 p-5 hover:border-accent/40 transition relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-primary/20 to-transparent blur-2xl" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone="cyan">#{c.id.slice(-6).toUpperCase()}</Badge>
                    <Badge>{c.crime_type}</Badge>
                    <Badge tone={riskTone(c.risk_score) as any}>RISK {c.risk_score}</Badge>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold">{c.title}</h3>
                  <div className="text-xs text-muted-foreground mt-0.5">Status: {c.status} · Created: {new Date(c.created_at).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</div>
                  <div className={`text-lg font-semibold ticker-mono ${c.status === "open" ? "text-accent" : "text-muted-foreground"}`}>{c.status.toUpperCase()}</div>
                </div>
              </div>

              {c.ai_risk_level && (
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                  Risk Level: {c.ai_risk_level}
                  {c.ai_risk_recommendation && ` — ${c.ai_risk_recommendation}`}
                </p>
              )}

              <div className="mt-4 grid grid-cols-3 gap-3">
                <Stat icon={AlertTriangle} label="Risk" value={c.risk_score} />
                <Stat icon={FileSearch} label="Type" value={c.crime_type} />
                <Stat icon={Users} label="Status" value={c.status} />
              </div>

              <div className="mt-4 flex items-center justify-end">
                <Link to="/cases_/$id" params={{ id: c.id }} className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20">
                  <Eye className="h-3.5 w-3.5" /> Open Case
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-md bg-secondary/30 border border-border/40 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground"><Icon className="h-3 w-3" />{label}</div>
      <div className="text-sm font-semibold mt-0.5 ticker-mono truncate">{value}</div>
    </div>
  );
}
