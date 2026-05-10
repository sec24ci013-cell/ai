import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Maximize2, ScanFace, Activity, Camera, Upload as UploadIcon, Sparkles } from "lucide-react";
import { PageHeader, Panel, Badge } from "@/components/raw/ui";
import { listCases, analyzeCCTV, getCCTVEvents, getCCTVAIAnalysis, type CaseOut } from "@/lib/api";

export const Route = createFileRoute("/cctv")({
  head: () => ({ meta: [{ title: "CCTV Analytics · RAW" }] }),
  component: CCTV,
});

function CCTV() {
  const [cases, setCases] = useState<CaseOut[]>([]);
  const [selectedCase, setSelectedCase] = useState("");
  const [uploading, setUploading] = useState(false);
  const [cctvData, setCctvData] = useState<any>(null);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => { listCases().then(setCases).catch(() => { }); }, []);

  useEffect(() => {
    if (selectedCase) {
      getCCTVEvents(selectedCase).then(setCctvData).catch(() => setCctvData(null));
    }
  }, [selectedCase]);

  const handleUpload = async (files: FileList) => {
    if (!selectedCase) { setUploadResult("Select a case first."); return; }
    setUploading(true);
    setUploadResult(null);
    try {
      for (const file of Array.from(files)) {
        await analyzeCCTV(selectedCase, file);
      }
      setUploadResult("Video uploaded and queued for CCTV analytics.");
      // Refresh after a moment
      setTimeout(async () => {
        const data = await getCCTVEvents(selectedCase);
        setCctvData(data);
      }, 2000);
    } catch (err: any) {
      setUploadResult(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedCase) return;
    setAnalyzing(true);
    try {
      const res = await getCCTVAIAnalysis(selectedCase);
      if (res.analysis) {
        setAiAnalysis(res.analysis);
      } else {
        setAiAnalysis("No significant intelligence could be extracted.");
      }
    } catch (err) {
      console.error("Failed to run CCTV analysis:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const events = cctvData?.events || [];
  const flags = cctvData?.flags || [];
  const faceMatches = cctvData?.face_matches || [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="VISION INTELLIGENCE"
        title="CCTV Analytics Grid"
        desc="Multi-feed detection mesh with real-time face, motion, and object recognition."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={selectedCase} onChange={(e) => setSelectedCase(e.target.value)}
              className="h-9 px-3 rounded-md bg-secondary/40 border border-border/60 text-xs"
            >
              <option value="">Select case…</option>
              {cases.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !selectedCase || !cctvData?.events?.length}
              className="px-3 py-1.5 text-xs rounded-md bg-primary/20 text-primary hover:bg-primary/30 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" /> {analyzing ? "Analyzing..." : "AI Intelligence"}
            </button>
            <Badge tone={cctvData?.status === "complete" ? "success" : "cyan"}>
              {cctvData?.status === "complete" ? "ANALYZED" : "READY"}
            </Badge>
          </div>
        }
      />

      {/* Upload zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files); }}
        className="rounded-xl border-2 border-dashed border-border/70 p-8 text-center glass"
      >
        <UploadIcon className="h-8 w-8 mx-auto text-accent mb-2" />
        <p className="text-sm font-medium">Drop CCTV footage or <label className="text-accent cursor-pointer hover:underline"><input type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files && handleUpload(e.target.files)} />browse</label></p>
        <p className="text-[11px] text-muted-foreground mt-1">Supports MP4, AVI, MKV</p>
        {uploading && <p className="text-xs text-accent mt-2">Uploading and analyzing…</p>}
        {uploadResult && <p className={`text-xs mt-2 ${uploadResult.includes("failed") ? "text-destructive" : "text-success"}`}>{uploadResult}</p>}
      </div>

      {/* CCTV Events */}
      {events.length > 0 && (
        <Panel title="Detection Events" subtitle={`${events.length} DETECTIONS`}>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {events.map((ev: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="rounded-lg border border-border/60 bg-secondary/20 p-3 flex items-center gap-3">
                <Camera className="h-4 w-4 text-accent" />
                <div className="flex-1">
                  <div className="text-sm">{ev.label || ev.class_name || "Detection"}</div>
                  <div className="text-[10px] ticker-mono text-muted-foreground">
                    Frame: {ev.frame || "—"} · Track: {ev.track_id || "—"}
                  </div>
                </div>
                <Badge tone={ev.confidence > 0.8 ? "destructive" : "warn"}>
                  {typeof ev.confidence === "number" ? `${(ev.confidence * 100).toFixed(0)}%` : "—"}
                </Badge>
              </motion.div>
            ))}
          </div>
        </Panel>
      )}

      {/* Flagged Activity */}
      {flags.length > 0 && (
        <Panel title="Suspicious Activity" subtitle="AI FLAGGED" right={<Activity className="h-4 w-4 text-accent" />}>
          <div className="space-y-2">
            {flags.map((f: any, i: number) => (
              <div key={i} className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <div className="flex items-center gap-2">
                  <ScanFace className="h-4 w-4 text-destructive" />
                  <span>{f.description || f.type || "Suspicious activity detected"}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {aiAnalysis && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Panel title="AI Vision Intelligence" subtitle="AUTONOMOUS REASONING">
            <div className="text-sm leading-relaxed whitespace-pre-wrap p-2 text-muted-foreground">
              {aiAnalysis}
            </div>
          </Panel>
        </motion.div>
      )}

      {!selectedCase && (
        <p className="text-center py-10 text-muted-foreground text-sm">Select a case to view CCTV analytics.</p>
      )}
    </div>
  );
}
