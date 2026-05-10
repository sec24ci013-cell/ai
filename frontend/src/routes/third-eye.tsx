import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Eye, Brain, User, Upload, Search, Loader2, AlertTriangle,
  Scan, Fingerprint, Camera
} from "lucide-react";
import { PageHeader, Panel, Badge } from "@/components/raw/ui";
import { listCases, runFaceSketchAgent, type CaseOut } from "@/lib/api";

export const Route = createFileRoute("/third-eye")({
  head: () => ({ meta: [{ title: "Third Eye · Forensic Face Intelligence · RAW" }] }),
  component: ThirdEyePage,
});

function ThirdEyePage() {
  const [cases, setCases] = useState<CaseOut[]>([]);
  const [selectedCase, setSelectedCase] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<{ caseId: string; title: string; result: string; time: string }[]>([]);

  // Manual witness description fields
  const [witness, setWitness] = useState({
    faceShape: "oval",
    hairColor: "black",
    hairStyle: "short",
    eyeColor: "brown",
    eyeShape: "round",
    noseType: "straight",
    mouthType: "medium",
    skinTone: "medium",
    ageRange: "25-35",
    build: "medium",
    height: "170-175cm",
    distinguishing: "",
    additionalNotes: "",
  });

  useEffect(() => {
    listCases().then(setCases).catch(() => {});
  }, []);

  const handleAISketch = async () => {
    if (!selectedCase) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await runFaceSketchAgent(selectedCase);
      setResult(r.analysis);
      const caseInfo = cases.find(c => c.id === selectedCase);
      setHistory(prev => [{
        caseId: selectedCase,
        title: caseInfo?.title || selectedCase,
        result: r.analysis,
        time: new Date().toLocaleString()
      }, ...prev]);
    } catch (err) {
      setResult("Failed to generate suspect profile. Ensure evidence has been uploaded and processed.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualComposite = () => {
    const composite = `
═══════════════════════════════════════
  SUSPECT COMPOSITE PROFILE
  Generated: ${new Date().toLocaleString()}
═══════════════════════════════════════

FACIAL STRUCTURE
  Face Shape:     ${witness.faceShape}
  Skin Tone:      ${witness.skinTone}
  Estimated Age:  ${witness.ageRange}

HAIR
  Color:          ${witness.hairColor}
  Style:          ${witness.hairStyle}

EYES
  Color:          ${witness.eyeColor}
  Shape:          ${witness.eyeShape}

FACIAL FEATURES
  Nose:           ${witness.noseType}
  Mouth:          ${witness.mouthType}

PHYSICAL BUILD
  Build:          ${witness.build}
  Height:         ${witness.height}

DISTINGUISHING MARKS
  ${witness.distinguishing || "None reported"}

ADDITIONAL NOTES
  ${witness.additionalNotes || "None"}

═══════════════════════════════════════
  Classification: WITNESS-DESCRIBED
  Confidence: MEDIUM (manual input)
═══════════════════════════════════════`;
    setResult(composite);
    setHistory(prev => [{
      caseId: selectedCase || "manual",
      title: "Manual Composite",
      result: composite,
      time: new Date().toLocaleString()
    }, ...prev]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="FORENSIC FACE INTELLIGENCE"
        title="Third Eye"
        desc="AI-powered suspect face sketch construction and composite profile generation from witness statements and case evidence."
        actions={
          <Badge tone="cyan">THIRD-EYE MODULE</Badge>
        }
      />

      {/* Hero Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-strong rounded-xl border border-border/60 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg grid place-items-center bg-primary/10 text-primary">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold">{history.length}</div>
            <div className="text-[10px] uppercase text-muted-foreground">Profiles Generated</div>
          </div>
        </div>
        <div className="glass-strong rounded-xl border border-border/60 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg grid place-items-center bg-accent/10 text-accent">
            <Scan className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold">{cases.length}</div>
            <div className="text-[10px] uppercase text-muted-foreground">Active Cases</div>
          </div>
        </div>
        <div className="glass-strong rounded-xl border border-border/60 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg grid place-items-center bg-warn/10 text-warn">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold">AI</div>
            <div className="text-[10px] uppercase text-muted-foreground">Engine Active</div>
          </div>
        </div>
        <div className="glass-strong rounded-xl border border-border/60 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg grid place-items-center bg-destructive/10 text-destructive">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-bold">v2.0</div>
            <div className="text-[10px] uppercase text-muted-foreground">Recognition Module</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI-Powered Generation */}
        <Panel title="AI Composite Generation" subtitle="FROM CASE EVIDENCE" right={
          <Badge tone="success">AUTOMATED</Badge>
        }>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Select Case</label>
              <select
                value={selectedCase}
                onChange={(e) => setSelectedCase(e.target.value)}
                className="w-full h-11 px-3 rounded-lg bg-secondary/40 border border-border/60 text-sm"
              >
                <option value="">Choose a case…</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{c.title} — {c.crime_type}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The AI will analyze all uploaded evidence (witness statements, police reports, interview transcripts)
              and generate a detailed suspect facial composite description including face shape, hair, eyes,
              distinguishing marks, and estimated age/build.
            </p>
            <button
              onClick={handleAISketch}
              disabled={!selectedCase || loading}
              className="w-full h-11 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              {loading ? "Analyzing Evidence…" : "Generate AI Composite"}
            </button>
          </div>
        </Panel>

        {/* Manual Witness Description */}
        <Panel title="Manual Witness Input" subtitle="DRAG-AND-DROP FEATURES" right={
          <Badge>MANUAL</Badge>
        }>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[10px] uppercase text-muted-foreground">Face Shape</label>
              <select value={witness.faceShape} onChange={e => setWitness(p => ({...p, faceShape: e.target.value}))}
                className="w-full mt-1 px-2 py-1.5 rounded bg-secondary/40 border border-border/60">
                {["oval", "round", "square", "heart", "oblong", "diamond", "triangular"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground">Skin Tone</label>
              <select value={witness.skinTone} onChange={e => setWitness(p => ({...p, skinTone: e.target.value}))}
                className="w-full mt-1 px-2 py-1.5 rounded bg-secondary/40 border border-border/60">
                {["very light", "light", "medium", "olive", "brown", "dark brown", "dark"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground">Hair Color</label>
              <select value={witness.hairColor} onChange={e => setWitness(p => ({...p, hairColor: e.target.value}))}
                className="w-full mt-1 px-2 py-1.5 rounded bg-secondary/40 border border-border/60">
                {["black", "dark brown", "brown", "light brown", "blonde", "red", "gray", "white", "bald"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground">Hair Style</label>
              <select value={witness.hairStyle} onChange={e => setWitness(p => ({...p, hairStyle: e.target.value}))}
                className="w-full mt-1 px-2 py-1.5 rounded bg-secondary/40 border border-border/60">
                {["short", "medium", "long", "buzz cut", "curly", "wavy", "braided", "ponytail", "bald"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground">Eye Color</label>
              <select value={witness.eyeColor} onChange={e => setWitness(p => ({...p, eyeColor: e.target.value}))}
                className="w-full mt-1 px-2 py-1.5 rounded bg-secondary/40 border border-border/60">
                {["brown", "dark brown", "hazel", "green", "blue", "gray", "black"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground">Eye Shape</label>
              <select value={witness.eyeShape} onChange={e => setWitness(p => ({...p, eyeShape: e.target.value}))}
                className="w-full mt-1 px-2 py-1.5 rounded bg-secondary/40 border border-border/60">
                {["round", "almond", "hooded", "downturned", "upturned", "monolid", "deep-set", "wide-set"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground">Nose</label>
              <select value={witness.noseType} onChange={e => setWitness(p => ({...p, noseType: e.target.value}))}
                className="w-full mt-1 px-2 py-1.5 rounded bg-secondary/40 border border-border/60">
                {["straight", "wide", "narrow", "flat", "pointed", "hooked", "upturned", "bulbous"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground">Mouth</label>
              <select value={witness.mouthType} onChange={e => setWitness(p => ({...p, mouthType: e.target.value}))}
                className="w-full mt-1 px-2 py-1.5 rounded bg-secondary/40 border border-border/60">
                {["thin lips", "medium", "full lips", "wide", "small", "downturned"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground">Age Range</label>
              <select value={witness.ageRange} onChange={e => setWitness(p => ({...p, ageRange: e.target.value}))}
                className="w-full mt-1 px-2 py-1.5 rounded bg-secondary/40 border border-border/60">
                {["15-20", "20-25", "25-30", "30-35", "35-40", "40-50", "50-60", "60+"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground">Build</label>
              <select value={witness.build} onChange={e => setWitness(p => ({...p, build: e.target.value}))}
                className="w-full mt-1 px-2 py-1.5 rounded bg-secondary/40 border border-border/60">
                {["slim", "medium", "athletic", "stocky", "heavy", "muscular"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] uppercase text-muted-foreground">Distinguishing Marks (scars, tattoos, moles)</label>
              <input value={witness.distinguishing} onChange={e => setWitness(p => ({...p, distinguishing: e.target.value}))}
                placeholder="e.g. scar on left cheek, tattoo on right forearm"
                className="w-full mt-1 px-2 py-1.5 rounded bg-secondary/40 border border-border/60" />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] uppercase text-muted-foreground">Additional Notes</label>
              <textarea value={witness.additionalNotes} onChange={e => setWitness(p => ({...p, additionalNotes: e.target.value}))}
                placeholder="Clothing, accent, mannerisms, gait..."
                className="w-full mt-1 px-2 py-1.5 rounded bg-secondary/40 border border-border/60 h-14 resize-none" />
            </div>
          </div>
          <button onClick={handleManualComposite}
            className="w-full mt-4 h-10 rounded-lg bg-secondary border border-border/60 text-sm font-medium hover:bg-secondary/80 flex items-center justify-center gap-2">
            <User className="h-4 w-4" /> Generate Manual Composite
          </button>
        </Panel>
      </div>

      {/* Result Display */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Panel title="Suspect Composite Profile" subtitle="GENERATED OUTPUT" right={
            <Badge tone="warn">FORENSIC USE ONLY</Badge>
          }>
            <div className="text-sm leading-relaxed whitespace-pre-wrap p-4 bg-secondary/20 rounded-lg border border-border/40 font-mono max-h-[500px] overflow-y-auto">
              {result}
            </div>
          </Panel>
        </motion.div>
      )}

      {/* Generation History */}
      {history.length > 0 && (
        <Panel title="Generation History" subtitle={`${history.length} PROFILES`}>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/40 cursor-pointer hover:bg-secondary/40"
                onClick={() => setResult(h.result)}>
                <div className="flex items-center gap-3">
                  <Fingerprint className="h-4 w-4 text-accent" />
                  <div>
                    <div className="text-sm font-medium">{h.title}</div>
                    <div className="text-[10px] text-muted-foreground ticker-mono">{h.time}</div>
                  </div>
                </div>
                <Badge tone="cyan">View</Badge>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
