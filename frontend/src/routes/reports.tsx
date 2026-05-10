import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Loader2, Trash2 } from "lucide-react";
import { PageHeader, Panel, Badge } from "@/components/raw/ui";
import { listReports, generateReport, deleteReport, listCases, type ReportOut, type CaseOut } from "@/lib/api";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports · RAW" }] }),
  component: Reports,
});

function Reports() {
  const [reports, setReports] = useState<ReportOut[]>([]);
  const [cases, setCases] = useState<CaseOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedCase, setSelectedCase] = useState("");
  const [reportType, setReportType] = useState("legal");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadReports = async () => {
    try {
      const data = await listReports();
      setReports(data);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    listCases().then(setCases).catch(() => { });
  }, []);

  const handleGenerate = async () => {
    if (!selectedCase) return;
    setGenerating(true);
    try {
      await generateReport(selectedCase, reportType);
      loadReports();
    } catch (err) {
      console.error("Failed to generate report:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReport(id);
      loadReports();
    } catch (err) {
      console.error("Failed to delete report:", err);
    }
  };

  // Removed txt download logic. Users will now view the full Forensic Brief PDF.

  const statusTone = (s: string) => s === "complete" ? "success" : s === "generating" ? "warn" : "destructive";

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="DOCUMENTATION" title="Generated Reports" desc="AI-authored, hash-locked investigation briefs and audits." />

      {/* Generate controls */}
      <Panel title="Generate New Report">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Case</label>
            <select value={selectedCase} onChange={(e) => setSelectedCase(e.target.value)}
              className="w-full h-11 px-3 rounded-lg bg-secondary/40 border border-border/60 text-sm">
              <option value="">Select a case…</option>
              {cases.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}
              className="w-full h-11 px-3 rounded-lg bg-secondary/40 border border-border/60 text-sm">
              {["legal", "evidence", "timeline", "risk", "general"].map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={!selectedCase || generating}
            className="h-11 px-5 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {generating ? "Generating…" : "Generate Report"}
          </button>
        </div>
      </Panel>

      <Panel>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <span className="h-5 w-5 border-2 border-muted-foreground/40 border-t-accent rounded-full animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No reports generated yet.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {reports.map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-md grid place-items-center bg-secondary border border-border/60">
                    <FileText className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-medium cursor-pointer hover:text-accent" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                        {r.title}
                      </h4>
                      <Badge tone={statusTone(r.status)}>{r.status.toUpperCase()}</Badge>
                      <Badge tone="cyan">{r.report_type}</Badge>
                    </div>
                    <div className="text-[11px] ticker-mono text-muted-foreground mt-0.5">
                      {new Date(r.created_at).toLocaleDateString()} · {r.pages} pages
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.status === "complete" && (
                      <Link to="/cases_/$id_/report" params={{ id: r.case_id }}
                        className="px-3 py-1.5 rounded-md bg-accent text-accent-foreground hover:opacity-90 text-xs flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />Forensic Brief
                      </Link>
                    )}
                    <button onClick={() => handleDelete(r.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {expandedId === r.id && r.content && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-3 overflow-hidden">
                    <div className="rounded-lg bg-secondary/30 border border-border/40 p-4 text-sm whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                      {r.content}
                    </div>
                  </motion.div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
