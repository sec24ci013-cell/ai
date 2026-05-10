import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageHeader, Panel, Badge } from "@/components/raw/ui";
import { Filter, ZoomIn, Plus, X, Sparkles } from "lucide-react";
import { listCases, getCaseGraph, addRelationship, runGraphAgent, type CaseOut } from "@/lib/api";

export const Route = createFileRoute("/graph")({
  head: () => ({ meta: [{ title: "Graph Intelligence · RAW" }] }),
  component: Graph,
});

type Node = { id: string; x: number; y: number; r: number; tone: string; label: string };

function Graph() {
  const [cases, setCases] = useState<CaseOut[]>([]);
  const [selectedCase, setSelectedCase] = useState("");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<[string, string, string][]>([]);
  const [drag, setDrag] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [srcName, setSrcName] = useState("");
  const [tgtName, setTgtName] = useState("");
  const [relType, setRelType] = useState("KNOWS");
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { listCases().then(setCases).catch(() => { }); }, []);

  useEffect(() => {
    if (!selectedCase) return;
    getCaseGraph(selectedCase)
      .then((data) => {
        const graphNodes: Node[] = (data.nodes || []).map((n: any, i: number) => ({
          id: n.name || `node-${i}`,
          x: 15 + ((i * 67) % 70),
          y: 15 + ((i * 43) % 70),
          r: i === 0 ? 28 : 16,
          tone: i === 0 ? "destructive" : i % 3 === 0 ? "warn" : i % 2 === 0 ? "cyan" : "primary",
          label: (n.name || `N${i}`).slice(0, 6),
        }));
        const graphLinks: [string, string, string][] = (data.edges || []).map((e: any) => [
          e.source || "",
          e.target || "",
          e.relationship || "RELATED",
        ]);
        setNodes(graphNodes.length > 0 ? graphNodes : []);
        setLinks(graphLinks);
      })
      .catch(() => { setNodes([]); setLinks([]); });
  }, [selectedCase]);

  useEffect(() => {
    const m = (e: MouseEvent) => {
      if (!drag || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      setNodes((ns) => ns.map((n) => n.id === drag ? { ...n, x: Math.max(4, Math.min(96, x)), y: Math.max(4, Math.min(96, y)) } : n));
    };
    const u = () => setDrag(null);
    window.addEventListener("mousemove", m);
    window.addEventListener("mouseup", u);
    return () => { window.removeEventListener("mousemove", m); window.removeEventListener("mouseup", u); };
  }, [drag]);

  const handleAnalyze = async () => {
    if (!selectedCase) return;
    setAnalyzing(true);
    try {
      const res = await runGraphAgent(selectedCase);
      setAiAnalysis(res.analysis);
    } catch (err) {
      console.error("Failed to run graph agent:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!srcName || !tgtName) return;
    try {
      await addRelationship({ source_name: srcName, target_name: tgtName, relationship: relType });
      // Refresh
      if (selectedCase) {
        const data = await getCaseGraph(selectedCase);
        const graphNodes: Node[] = (data.nodes || []).map((n: any, i: number) => ({
          id: n.name || `node-${i}`,
          x: 15 + ((i * 67) % 70),
          y: 15 + ((i * 43) % 70),
          r: i === 0 ? 28 : 16,
          tone: i === 0 ? "destructive" : i % 3 === 0 ? "warn" : "primary",
          label: (n.name || `N${i}`).slice(0, 6),
        }));
        setNodes(graphNodes);
        setLinks((data.edges || []).map((ed: any) => [ed.source, ed.target, ed.relationship]));
      }
      setSrcName("");
      setTgtName("");
      setShowAdd(false);
    } catch (err) {
      console.error("Failed to add relationship:", err);
    }
  };

  const tone = (t: string) =>
    t === "destructive" ? "from-destructive to-warn ring-destructive/40" :
      t === "warn" ? "from-warn to-destructive/60 ring-warn/40" :
        t === "cyan" ? "from-accent to-primary ring-accent/40" : "from-primary to-accent ring-primary/40";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="RELATIONSHIP INTELLIGENCE"
        title="Entity Graph"
        desc="Drag nodes. Edges weight by communications, co-location, and AI-inferred affiliation."
        actions={
          <div className="flex items-center gap-2">
            <select value={selectedCase} onChange={(e) => setSelectedCase(e.target.value)}
              className="h-9 px-3 rounded-md bg-secondary/40 border border-border/60 text-xs">
              <option value="">Select case…</option>
              {cases.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <button onClick={() => setShowAdd(true)} className="px-3 py-1.5 text-xs rounded-md glass border border-border flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" />Add Relationship
            </button>
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !selectedCase || nodes.length === 0}
              className="px-3 py-1.5 text-xs rounded-md bg-primary/20 text-primary hover:bg-primary/30 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" /> {analyzing ? "Analyzing..." : "AI Analysis"}
            </button>
            <Badge tone="cyan">{nodes.length} ENTITIES · {links.length} EDGES</Badge>
          </div>
        }
      />

      {showAdd && (
        <Panel title="Add Relationship">
          <form onSubmit={handleAddRelationship} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[120px]">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Source</label>
              <input type="text" value={srcName} onChange={(e) => setSrcName(e.target.value)} required
                className="w-full h-9 px-3 rounded-md bg-secondary/40 border border-border/60 text-sm" placeholder="Person A" />
            </div>
            <div className="min-w-[120px]">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Relationship</label>
              <input type="text" value={relType} onChange={(e) => setRelType(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-secondary/40 border border-border/60 text-sm" placeholder="KNOWS" />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">Target</label>
              <input type="text" value={tgtName} onChange={(e) => setTgtName(e.target.value)} required
                className="w-full h-9 px-3 rounded-md bg-secondary/40 border border-border/60 text-sm" placeholder="Person B" />
            </div>
            <button type="submit" className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-xs">Add</button>
            <button type="button" onClick={() => setShowAdd(false)} className="h-9 px-3 text-muted-foreground"><X className="h-4 w-4" /></button>
          </form>
        </Panel>
      )}

      <Panel title="Network Topology" subtitle="LIVE · NEO-GRAPH ENGINE" right={<ZoomIn className="h-4 w-4 text-muted-foreground" />}>
        {nodes.length === 0 ? (
          <p className="text-center py-20 text-muted-foreground text-sm">
            {selectedCase ? "No graph data for this case. Add relationships or run the Graph AI Agent." : "Select a case to view the entity graph."}
          </p>
        ) : (
          <div ref={ref} className="relative aspect-[16/10] rounded-md border border-border/60 grid-bg overflow-hidden select-none">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="line" x1="0" x2="1">
                  <stop offset="0%" stopColor="oklch(0.85 0.16 200 / 0.6)" />
                  <stop offset="100%" stopColor="oklch(0.7 0.18 240 / 0.6)" />
                </linearGradient>
              </defs>
              {links.map(([a, b], i) => {
                const A = nodes.find((n) => n.id === a);
                const B = nodes.find((n) => n.id === b);
                if (!A || !B) return null;
                return (
                  <g key={i}>
                    <line x1={`${A.x}%`} y1={`${A.y}%`} x2={`${B.x}%`} y2={`${B.y}%`} stroke="url(#line)" strokeWidth="1.5" strokeDasharray="4 4">
                      <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="1.4s" repeatCount="indefinite" />
                    </line>
                  </g>
                );
              })}
            </svg>
            {nodes.map((n) => (
              <motion.div
                key={n.id}
                onMouseDown={() => setDrag(n.id)}
                animate={{ left: `${n.x}%`, top: `${n.y}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing rounded-full grid place-items-center font-semibold text-xs bg-gradient-to-br ${tone(n.tone)} ring-4 shadow-lg`}
                style={{ width: n.r * 2, height: n.r * 2 }}
              >
                {n.label}
              </motion.div>
            ))}
            <div className="absolute bottom-2 left-2 text-[10px] ticker-mono text-muted-foreground">DRAG NODES · WHEEL TO PAN (visual)</div>
          </div>
        )}
      </Panel>

      {aiAnalysis && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Panel title="Graph AI Intelligence" subtitle="NEO-GRAPH INSIGHTS">
            <div className="text-sm leading-relaxed whitespace-pre-wrap p-2 text-muted-foreground">
              {aiAnalysis}
            </div>
          </Panel>
        </motion.div>
      )}
    </div>
  );
}
