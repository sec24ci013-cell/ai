import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Upload } from "lucide-react";
import { PageHeader, Panel, Badge } from "@/components/raw/ui";
import { listCases, transcribeAudio, type CaseOut } from "@/lib/api";

export const Route = createFileRoute("/voice")({
  head: () => ({ meta: [{ title: "Voice Intelligence · RAW" }] }),
  component: Voice,
});

function Voice() {
  const [cases, setCases] = useState<CaseOut[]>([]);
  const [selectedCase, setSelectedCase] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => { listCases().then(setCases).catch(() => { }); }, []);

  const handleUpload = async (file: File) => {
    if (!selectedCase) { setError("Select a case first."); return; }
    setUploading(true);
    setError("");
    setResult(null);
    try {
      const data = await transcribeAudio(selectedCase, file);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Transcription failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ACOUSTIC INTELLIGENCE"
        title="Voice Analysis"
        desc="Upload audio files for AI transcription, entity extraction, and NLP analysis."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={selectedCase} onChange={(e) => setSelectedCase(e.target.value)}
              className="h-9 px-3 rounded-md bg-secondary/40 border border-border/60 text-xs"
            >
              <option value="">Select case…</option>
              {cases.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <Badge tone={uploading ? "destructive" : "cyan"}>{uploading ? "● PROCESSING" : "READY"}</Badge>
          </div>
        }
      />

      <Panel>
        <div className="flex flex-col items-center justify-center py-10">
          <motion.label
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="relative h-44 w-44 rounded-full grid place-items-center cursor-pointer transition bg-gradient-to-br from-primary to-accent"
          >
            <input type="file" accept="audio/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
            {uploading ? (
              <>
                <span className="absolute inset-0 rounded-full border border-accent/40 animate-ping" />
                <MicOff className="h-12 w-12 text-foreground" />
              </>
            ) : (
              <Mic className="h-12 w-12 text-foreground" />
            )}
          </motion.label>

          {uploading && (
            <div className="mt-8 flex items-end gap-1 h-16">
              {Array.from({ length: 36 }).map((_, i) => (
                <motion.div key={i} className="w-1.5 rounded-full bg-gradient-to-t from-primary to-accent"
                  animate={{ height: [8, 30 + (i % 5) * 8, 8] }}
                  transition={{ duration: 0.6 + (i % 4) * 0.2, repeat: Infinity, delay: i * 0.03 }} />
              ))}
            </div>
          )}

          <div className="mt-8 ticker-mono text-xs text-muted-foreground">
            {uploading ? "● Processing · Neural transcription engaged" : "Click to upload an audio file for transcription"}
          </div>

          {error && <p className="mt-4 text-xs text-destructive">{error}</p>}
        </div>
      </Panel>

      {result && (
        <>
          <Panel title="Transcript" subtitle={`SESSION ${result.audio_id?.slice(-6) || "—"}`}>
            <div className="text-sm whitespace-pre-wrap max-h-[400px] overflow-y-auto">
              {result.transcript?.full_transcript || "No transcript available."}
            </div>
          </Panel>

          {result.ai_summary && (
            <Panel title="AI Summary" subtitle="NLP ANALYSIS">
              <p className="text-sm">{result.ai_summary}</p>
            </Panel>
          )}

          {result.entities && Object.keys(result.entities).length > 0 && (
            <Panel title="Extracted Entities" subtitle="spaCy NER">
              <div className="flex flex-wrap gap-2">
                {Object.entries(result.entities).map(([key, val]: [string, any]) => (
                  <Badge key={key} tone="cyan">{key}: {Array.isArray(val) ? val.join(", ") : String(val)}</Badge>
                ))}
              </div>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
