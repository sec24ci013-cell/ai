import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock4, Plus, X } from "lucide-react";
import { PageHeader, Panel, Badge } from "@/components/raw/ui";
import { getCaseTimeline, createTimelineEvent, listCases, type TimelineEventOut, type CaseOut } from "@/lib/api";

export const Route = createFileRoute("/timeline")({
  head: () => ({ meta: [{ title: "Timeline Reconstruction · RAW" }] }),
  component: Timeline,
});

function Timeline() {
  const [cases, setCases] = useState<CaseOut[]>([]);
  const [selectedCase, setSelectedCase] = useState("");
  const [events, setEvents] = useState<TimelineEventOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => { listCases().then(setCases).catch(() => { }); }, []);

  useEffect(() => {
    if (selectedCase) {
      setLoading(true);
      getCaseTimeline(selectedCase).then(setEvents).catch(() => setEvents([])).finally(() => setLoading(false));
    }
  }, [selectedCase]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType.trim() || !selectedCase) return;
    setAdding(true);
    try {
      await createTimelineEvent({ case_id: selectedCase, event_type: newType, description: newDesc || undefined });
      const updated = await getCaseTimeline(selectedCase);
      setEvents(updated);
      setNewType("");
      setNewDesc("");
      setShowAdd(false);
    } catch (err) {
      console.error("Failed to add event:", err);
    } finally {
      setAdding(false);
    }
  };

  const toneForType = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("gap") || t.includes("anomaly") || t.includes("alert")) return "destructive";
    if (t.includes("warn") || t.includes("suspect")) return "warn";
    return "cyan";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="EVENT RECONSTRUCTION"
        title="Forensic Timeline"
        desc="Cross-modal event correlation across CCTV, GPS, communications and witness streams."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={selectedCase}
              onChange={(e) => setSelectedCase(e.target.value)}
              className="h-9 px-3 rounded-md bg-secondary/40 border border-border/60 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Select case…</option>
              {cases.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            {selectedCase && (
              <button
                onClick={() => setShowAdd(true)}
                className="px-3 py-1.5 rounded-md text-xs bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add Event
              </button>
            )}
          </div>
        }
      />

      {showAdd && (
        <Panel title="Add Timeline Event">
          <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Event Type</label>
              <input
                type="text" value={newType} onChange={(e) => setNewType(e.target.value)} required
                className="w-full h-9 px-3 rounded-md bg-secondary/40 border border-border/60 text-sm"
                placeholder="GPS, CCTV, CALL…"
              />
            </div>
            <div className="flex-[2] min-w-[200px]">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Description</label>
              <input
                type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-secondary/40 border border-border/60 text-sm"
                placeholder="Subject enters Quadrant 7…"
              />
            </div>
            <button type="submit" disabled={adding} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-xs disabled:opacity-50">
              {adding ? "Adding…" : "Add"}
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="h-9 px-3 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </form>
        </Panel>
      )}

      <Panel title="Event Stream" subtitle={selectedCase ? "MULTI-SOURCE" : "SELECT A CASE"}>
        {!selectedCase ? (
          <p className="text-sm text-muted-foreground text-center py-10">Select a case to view its timeline.</p>
        ) : loading ? (
          <div className="flex items-center justify-center py-10">
            <span className="h-5 w-5 border-2 border-muted-foreground/40 border-t-accent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-muted-foreground">Loading timeline…</span>
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No events recorded. Add events above.</p>
        ) : (
          <div className="relative pl-8">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-accent/40 to-transparent" />
            <ul className="space-y-4">
              {events.map((e, i) => {
                const tone = toneForType(e.event_type);
                return (
                  <motion.li key={e.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="relative">
                    <span className={`absolute -left-[22px] top-2 h-3.5 w-3.5 rounded-full ring-4 ring-background ${tone === "destructive" ? "bg-destructive" : tone === "warn" ? "bg-warn" : "bg-accent"
                      }`} />
                    <div className="rounded-lg glass border border-border/60 p-4 hover:border-accent/40 transition">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="ticker-mono text-xs text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</span>
                        <Badge tone={tone as any}>{e.event_type}</Badge>
                        <span className="text-[10px] ticker-mono text-muted-foreground">CONF {(e.confidence_score * 100).toFixed(0)}%</span>
                      </div>
                      {e.description && <p className="text-xs text-muted-foreground mt-1.5">{e.description}</p>}
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        )}
      </Panel>
    </div>
  );
}
