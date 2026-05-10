import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, ImageIcon, Cctv, Hash, ShieldCheck, Check, Loader2 } from "lucide-react";
import { PageHeader, Panel, Badge } from "@/components/raw/ui";
import { uploadEvidence, listCases, getCaseEvidence, type CaseOut, type EvidenceItem } from "@/lib/api";

export const Route = createFileRoute("/evidence")({
  head: () => ({ meta: [{ title: "Evidence Upload · RAW" }] }),
  component: Evidence,
});

const STAGES = ["Hashing", "Metadata", "OCR / Vision", "AI Tagging", "Chain Locked"];

function getStage(status: string): number {
  switch (status) {
    case "pending": return 1;
    case "processing": return 3;
    case "complete": return 5;
    case "failed": return 2;
    default: return 0;
  }
}

function getIcon(type: string) {
  switch (type.toLowerCase()) {
    case "video": case "cctv": return Cctv;
    case "image": case "photo": return ImageIcon;
    default: return FileText;
  }
}

function Evidence() {
  const [drag, setDrag] = useState(false);
  const [cases, setCases] = useState<CaseOut[]>([]);
  const [selectedCase, setSelectedCase] = useState("");
  const [evidenceType, setEvidenceType] = useState("document");
  const [uploading, setUploading] = useState(false);
  const [recentEvidence, setRecentEvidence] = useState<EvidenceItem[]>([]);
  const [uploadResult, setUploadResult] = useState<string | null>(null);

  useEffect(() => {
    listCases().then(setCases).catch(() => { });
  }, []);

  useEffect(() => {
    if (selectedCase) {
      getCaseEvidence(selectedCase).then(setRecentEvidence).catch(() => { });
    }
  }, [selectedCase]);

  const handleFiles = useCallback(async (files: FileList) => {
    if (!selectedCase) {
      setUploadResult("Please select a case first.");
      return;
    }
    setUploading(true);
    setUploadResult(null);
    try {
      for (const file of Array.from(files)) {
        await uploadEvidence(selectedCase, evidenceType, file);
      }
      setUploadResult(`${files.length} file(s) uploaded and queued for AI analysis.`);
      // Refresh evidence list
      const updated = await getCaseEvidence(selectedCase);
      setRecentEvidence(updated);
    } catch (err: any) {
      setUploadResult(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }, [selectedCase, evidenceType]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="ACQUISITION" title="Evidence Intake" desc="Drop files for hash-verified ingestion. AI extraction, OCR and chain-of-custody locking happen in parallel." />

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Target Case</label>
          <select
            value={selectedCase}
            onChange={(e) => setSelectedCase(e.target.value)}
            className="w-full h-11 px-3 rounded-lg bg-secondary/40 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Select a case…</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>{c.title} ({c.crime_type})</option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Evidence Type</label>
          <select
            value={evidenceType}
            onChange={(e) => setEvidenceType(e.target.value)}
            className="w-full h-11 px-3 rounded-lg bg-secondary/40 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {["document", "image", "video", "audio", "data", "cctv", "biometric"].map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
        className={`relative rounded-2xl border-2 border-dashed p-12 text-center transition ${drag ? "border-accent bg-accent/5 glow-cyan" : "border-border/70 glass"}`}
      >
        <div className="absolute inset-0 grid-bg opacity-30 rounded-2xl" />
        <div className="relative">
          <div className="mx-auto h-16 w-16 rounded-full grid place-items-center bg-gradient-to-br from-primary/30 to-accent/30 border border-accent/40">
            {uploading ? <Loader2 className="h-7 w-7 text-accent animate-spin" /> : <Upload className="h-7 w-7 text-accent" />}
          </div>
          <h3 className="mt-4 text-lg font-semibold">{uploading ? "Uploading…" : "Drop evidence to ingest"}</h3>
          <p className="text-sm text-muted-foreground mt-1">Video · Audio · Documents · Images · Logs · Biometric Bundles</p>
          <label className="mt-4 inline-flex items-center gap-2 text-sm text-accent cursor-pointer hover:underline">
            <input type="file" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
            Or click to browse files
          </label>
          <div className="mt-4 inline-flex items-center gap-2 text-[11px] ticker-mono text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" /> AES-256 · HASH-VERIFIED · TAMPER-EVIDENT
          </div>
        </div>
      </div>

      {uploadResult && (
        <div className={`rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${uploadResult.includes("failed") ? "bg-destructive/10 border border-destructive/30 text-destructive" : "bg-success/10 border border-success/30 text-success"}`}>
          <Check className="h-4 w-4" /> {uploadResult}
        </div>
      )}

      {/* Recent evidence */}
      <Panel title="Recent Ingestion" subtitle="LIVE PIPELINE">
        {recentEvidence.length > 0 ? (
          <div className="space-y-3">
            {recentEvidence.map((it, i) => {
              const Icon = getIcon(it.type);
              const stage = getStage(it.ai_status);
              return (
                <motion.div key={it.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-lg border border-border/60 bg-secondary/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md grid place-items-center bg-secondary border border-border/60">
                      <Icon className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-medium truncate">{it.path.split("/").pop()}</h4>
                        <Badge tone="cyan">{it.type}</Badge>
                      </div>
                      <div className="text-[10px] ticker-mono text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Hash className="h-3 w-3" /> {it.hash ? `${it.hash.slice(0, 12)}…` : "—"}
                      </div>
                    </div>
                    <Badge tone={stage === 5 ? "success" : it.ai_status === "failed" ? "destructive" : "warn"}>
                      {stage === 5 ? "LOCKED" : it.ai_status === "failed" ? "FAILED" : "PROCESSING"}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-5 gap-1">
                    {STAGES.map((s, idx) => (
                      <div key={s} className="space-y-1">
                        <div className={`h-1 rounded-full ${idx < stage ? "bg-gradient-to-r from-primary to-accent" : "bg-secondary"}`} />
                        <div className={`text-[9px] uppercase tracking-wider ${idx < stage ? "text-accent" : "text-muted-foreground"}`}>{s}</div>
                      </div>
                    ))}
                  </div>
                  {it.ai_summary && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{it.ai_summary}</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            {selectedCase ? "No evidence for this case yet. Upload files above." : "Select a case to view evidence pipeline."}
          </p>
        )}
      </Panel>
    </div>
  );
}
