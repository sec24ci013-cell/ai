import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Cctv, FileText, Fingerprint, ShieldAlert, Sparkles, Upload, Brain, Clock, User } from "lucide-react";
import { Panel, Badge, PageHeader } from "@/components/raw/ui";
import {
  getCase, getCaseEvidence, getCaseTimeline, getRiskScore,
  runAutopsyAgent, runToDAgent, runFaceSketchAgent,
  type CaseOut, type EvidenceItem, type TimelineEventOut, type ToDParams
} from "@/lib/api";

export const Route = createFileRoute("/cases_/$id")({
  head: ({ params }) => ({ meta: [{ title: `Case ${params.id} · RAW` }] }),
  component: CaseDetail,
});

function CaseDetail() {
  const { id } = Route.useParams();
  const [caseData, setCaseData] = useState<CaseOut | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineEventOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskLoading, setRiskLoading] = useState(false);
  // Autopsy
  const [autopsyResult, setAutopsyResult] = useState<string | null>(null);
  const [autopsyLoading, setAutopsyLoading] = useState(false);
  // Time-of-Death
  const [todResult, setTodResult] = useState<string | null>(null);
  const [todLoading, setTodLoading] = useState(false);
  const [todParams, setTodParams] = useState<ToDParams>({
    body_temp_celsius: 32, ambient_temp_celsius: 22, body_weight_kg: 70,
    rigor_mortis: "developing", livor_mortis: "faint_blanching",
    clothing: "normal", scene_discovery_time: "", additional_observations: ""
  });
  // Suspect Sketch
  const [sketchResult, setSketchResult] = useState<string | null>(null);
  const [sketchLoading, setSketchLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, ev, tl] = await Promise.all([
          getCase(id),
          getCaseEvidence(id).catch(() => []),
          getCaseTimeline(id).catch(() => []),
        ]);
        setCaseData(c);
        setEvidence(ev);
        setTimeline(tl);
      } catch (err) {
        console.error("Failed to load case:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleRiskAnalysis = async () => {
    setRiskLoading(true);
    try {
      const result = await getRiskScore(id);
      setCaseData((prev) => prev ? { ...prev, risk_score: result.score, ai_risk_level: result.risk_level, ai_risk_flags: result.flags, ai_risk_recommendation: result.recommendation } : prev);
    } catch (err) {
      console.error("Risk analysis failed:", err);
    } finally {
      setRiskLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground text-sm flex items-center gap-3">
          <span className="h-5 w-5 border-2 border-muted-foreground/40 border-t-accent rounded-full animate-spin" />
          Loading case intelligence…
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold">Case not found</h2>
        <Link to="/cases" className="mt-4 text-accent text-sm">← Return to Cases</Link>
      </div>
    );
  }

  const riskTone = caseData.risk_score > 70 ? "destructive" : caseData.risk_score > 40 ? "warn" : "cyan";

  return (
    <div className="space-y-6">
      <Link to="/cases" className="text-xs text-muted-foreground hover:text-accent inline-flex items-center gap-1">
        <ArrowLeft className="h-3 w-3" /> All Cases
      </Link>
      <PageHeader
        eyebrow={`CASE FILE · #${id.slice(-8).toUpperCase()}`}
        title={caseData.title}
        desc={`${caseData.crime_type} · Status: ${caseData.status} · Created: ${new Date(caseData.created_at).toLocaleDateString()}`}
        actions={
          <>
            <Badge tone={riskTone as any}>RISK {caseData.risk_score}</Badge>
            {caseData.ai_risk_level && <Badge tone="cyan">{caseData.ai_risk_level}</Badge>}
            <button
              onClick={handleRiskAnalysis}
              disabled={riskLoading}
              className="px-3 py-1.5 rounded-md text-xs bg-primary/15 text-primary hover:bg-primary/25 flex items-center gap-1.5 disabled:opacity-50"
            >
              <ShieldAlert className="h-3.5 w-3.5" />{riskLoading ? "Analyzing…" : "Run Risk Analysis"}
            </button>
            <Link
              to="/cases_/$id_/report" params={{ id }}
              className="px-3 py-1.5 rounded-md text-xs bg-accent text-accent-foreground hover:opacity-90 flex items-center gap-1.5 ml-2"
            >
              <FileText className="h-3.5 w-3.5" /> Forensic Brief
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="AI Investigation Summary" subtitle="NEURAL CORE 4.2" className="lg:col-span-2">
          <div className="space-y-3 text-sm leading-relaxed">
            {caseData.ai_risk_recommendation ? (
              <>
                <p>{caseData.ai_risk_recommendation}</p>
                {caseData.ai_risk_flags && caseData.ai_risk_flags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {caseData.ai_risk_flags.map((flag, i) => (
                      <Badge key={i} tone="warn">{flag}</Badge>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">No AI analysis available yet. Run risk analysis or upload evidence to trigger AI processing.</p>
            )}
          </div>
        </Panel>

        <Panel title="Case Metrics" subtitle="OVERVIEW">
          <div className="space-y-3">
            {[
              { l: "Risk Score", v: caseData.risk_score, c: riskTone === "destructive" ? "bg-destructive" : riskTone === "warn" ? "bg-warn" : "bg-accent" },
              { l: "Evidence Items", v: evidence.length, c: "bg-primary" },
              { l: "Timeline Events", v: timeline.length, c: "bg-accent" },
              { l: "AI Analyzed", v: evidence.filter(e => e.ai_status === "complete").length, c: "bg-primary" },
            ].map((m) => (
              <div key={m.l}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{m.l}</span>
                  <span className="ticker-mono">{m.v}</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, typeof m.v === "number" ? m.v : 50)}%` }}
                    transition={{ duration: 1 }}
                    className={`h-full ${m.c}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Evidence Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Evidence Gallery" subtitle={`${evidence.length} ITEMS`}>
          {evidence.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {evidence.map((ev, i) => (
                <motion.div
                  key={ev.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="rounded-lg border border-border/60 bg-secondary/20 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-md grid place-items-center bg-secondary border border-border/60">
                      <FileText className="h-4 w-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{ev.path.split("/").pop()}</span>
                        <Badge tone="cyan">{ev.type}</Badge>
                      </div>
                      {ev.ai_summary && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{ev.ai_summary}</p>}
                    </div>
                    <Badge tone={ev.ai_status === "complete" ? "success" : ev.ai_status === "processing" ? "warn" : "default"}>
                      {ev.ai_status.toUpperCase()}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No evidence uploaded. Go to Evidence Upload to add files.
            </div>
          )}
        </Panel>

        <Panel title="Timeline Events" subtitle={`${timeline.length} EVENTS`}>
          {timeline.length > 0 ? (
            <div className="relative pl-6 space-y-3 max-h-[300px] overflow-y-auto">
              <div className="absolute left-2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-accent/40 to-transparent" />
              {timeline.map((ev, i) => (
                <motion.div
                  key={ev.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="relative"
                >
                  <span className="absolute -left-[14px] top-2 h-3 w-3 rounded-full ring-4 ring-background bg-accent" />
                  <div className="rounded-lg glass border border-border/60 p-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="ticker-mono text-[10px] text-muted-foreground">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                      <Badge tone="cyan">{ev.event_type}</Badge>
                    </div>
                    {ev.description && <p className="text-xs text-muted-foreground mt-1">{ev.description}</p>}
                    <div className="text-[10px] ticker-mono text-muted-foreground mt-1">Confidence: {(ev.confidence_score * 100).toFixed(0)}%</div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground text-sm">No timeline events recorded.</p>
          )}
        </Panel>
      </div>

      {/* === FORENSIC INTELLIGENCE PANELS === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Autopsy Intelligence */}
        <Panel title="Autopsy Intelligence" subtitle="POSTMORTEM ANALYSIS" right={
          <button onClick={async () => {
            setAutopsyLoading(true);
            try { const r = await runAutopsyAgent(id); setAutopsyResult(r.analysis); } catch(e) { console.error(e); }
            finally { setAutopsyLoading(false); }
          }} disabled={autopsyLoading}
          className="px-3 py-1.5 text-xs rounded-md bg-primary/20 text-primary hover:bg-primary/30 flex items-center gap-1.5 disabled:opacity-50">
            <Brain className="h-3.5 w-3.5" /> {autopsyLoading ? "Analyzing…" : "Run Autopsy AI"}
          </button>
        }>
          {autopsyResult ? (
            <div className="text-sm leading-relaxed whitespace-pre-wrap p-2">{autopsyResult}</div>
          ) : (
            <p className="text-center py-8 text-muted-foreground text-sm">Upload autopsy/medical evidence then click "Run Autopsy AI" to extract forensic findings.</p>
          )}
        </Panel>

        {/* Time-of-Death Estimator */}
        <Panel title="Time-of-Death Estimator" subtitle="HENSSGE NOMOGRAM + AI" right={
          <button onClick={async () => {
            setTodLoading(true);
            try { const r = await runToDAgent(id, todParams); setTodResult(r.analysis); } catch(e) { console.error(e); }
            finally { setTodLoading(false); }
          }} disabled={todLoading}
          className="px-3 py-1.5 text-xs rounded-md bg-primary/20 text-primary hover:bg-primary/30 flex items-center gap-1.5 disabled:opacity-50">
            <Clock className="h-3.5 w-3.5" /> {todLoading ? "Estimating…" : "Estimate ToD"}
          </button>
        }>
          {!todResult ? (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] uppercase text-muted-foreground">Body Temp (°C)</label>
                <input type="number" step="0.1" value={todParams.body_temp_celsius} onChange={e => setTodParams(p => ({...p, body_temp_celsius: parseFloat(e.target.value)}))} className="w-full mt-1 px-2 py-1.5 rounded bg-secondary/40 border border-border/60" />
              </div>
              <div>
                <label className="text-[10px] uppercase text-muted-foreground">Ambient Temp (°C)</label>
                <input type="number" step="0.1" value={todParams.ambient_temp_celsius} onChange={e => setTodParams(p => ({...p, ambient_temp_celsius: parseFloat(e.target.value)}))} className="w-full mt-1 px-2 py-1.5 rounded bg-secondary/40 border border-border/60" />
              </div>
              <div>
                <label className="text-[10px] uppercase text-muted-foreground">Body Weight (kg)</label>
                <input type="number" value={todParams.body_weight_kg} onChange={e => setTodParams(p => ({...p, body_weight_kg: parseFloat(e.target.value)}))} className="w-full mt-1 px-2 py-1.5 rounded bg-secondary/40 border border-border/60" />
              </div>
              <div>
                <label className="text-[10px] uppercase text-muted-foreground">Clothing</label>
                <select value={todParams.clothing} onChange={e => setTodParams(p => ({...p, clothing: e.target.value}))} className="w-full mt-1 px-2 py-1.5 rounded bg-secondary/40 border border-border/60">
                  <option value="naked">Naked</option><option value="light">Light</option><option value="normal">Normal</option><option value="heavy">Heavy</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase text-muted-foreground">Rigor Mortis</label>
                <select value={todParams.rigor_mortis} onChange={e => setTodParams(p => ({...p, rigor_mortis: e.target.value}))} className="w-full mt-1 px-2 py-1.5 rounded bg-secondary/40 border border-border/60">
                  <option value="absent">Absent</option><option value="developing">Developing</option><option value="full">Full Body</option><option value="passing">Passing</option><option value="resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase text-muted-foreground">Livor Mortis</label>
                <select value={todParams.livor_mortis} onChange={e => setTodParams(p => ({...p, livor_mortis: e.target.value}))} className="w-full mt-1 px-2 py-1.5 rounded bg-secondary/40 border border-border/60">
                  <option value="absent">Absent</option><option value="faint_blanching">Faint (Blanching)</option><option value="developed_blanching">Developed (Blanching)</option><option value="fixed">Fixed (Non-blanching)</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] uppercase text-muted-foreground">Additional Observations</label>
                <textarea value={todParams.additional_observations} onChange={e => setTodParams(p => ({...p, additional_observations: e.target.value}))} placeholder="Stomach contents, decomposition signs, etc." className="w-full mt-1 px-2 py-1.5 rounded bg-secondary/40 border border-border/60 h-16 resize-none" />
              </div>
            </div>
          ) : (
            <div className="text-sm leading-relaxed whitespace-pre-wrap p-2">{todResult}</div>
          )}
        </Panel>
      </div>

      {/* Suspect Sketch Agent (Third-Eye inspired) */}
      <Panel title="Suspect Composite Profile" subtitle="FORENSIC FACE SKETCH · THIRD-EYE" right={
        <button onClick={async () => {
          setSketchLoading(true);
          try { const r = await runFaceSketchAgent(id); setSketchResult(r.analysis); } catch(e) { console.error(e); }
          finally { setSketchLoading(false); }
        }} disabled={sketchLoading}
        className="px-3 py-1.5 text-xs rounded-md bg-primary/20 text-primary hover:bg-primary/30 flex items-center gap-1.5 disabled:opacity-50">
          <User className="h-3.5 w-3.5" /> {sketchLoading ? "Generating…" : "Generate Profile"}
        </button>
      }>
        {sketchResult ? (
          <div className="text-sm leading-relaxed whitespace-pre-wrap p-2">{sketchResult}</div>
        ) : (
          <p className="text-center py-8 text-muted-foreground text-sm">Upload witness statements, then click "Generate Profile" to create a suspect composite description.</p>
        )}
      </Panel>

      {/* Chain of Custody */}
      <Panel title="Chain of Custody" subtitle="TAMPER-EVIDENT LEDGER">
        <ul className="space-y-2 text-xs">
          {evidence.slice(0, 5).map((ev, i) => (
            <li key={i} className="flex items-center gap-3 p-2 rounded-md bg-secondary/30 border border-border/40">
              <Fingerprint className="h-3.5 w-3.5 text-accent" />
              <div className="flex-1">
                <div>Evidence uploaded: {ev.path.split("/").pop()}</div>
                <div className="text-[10px] text-muted-foreground">Type: {ev.type} · Status: {ev.ai_status}</div>
              </div>
              <div className="ticker-mono text-[10px] text-muted-foreground">{ev.hash ? `${ev.hash.slice(0, 8)}…` : "—"}</div>
            </li>
          ))}
          {evidence.length === 0 && (
            <li className="text-muted-foreground text-center py-4">No evidence in chain.</li>
          )}
        </ul>
      </Panel>
    </div>
  );
}
