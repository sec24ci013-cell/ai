import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Download, ShieldAlert, FileText, Activity, Fingerprint } from "lucide-react";
import { PageHeader, Badge } from "@/components/raw/ui";
import { 
  getCase, getCaseEvidence, getCaseTimeline, listReports,
  type CaseOut, type EvidenceItem, type TimelineEventOut, type ReportOut
} from "@/lib/api";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

export const Route = createFileRoute("/cases_/$id_/report")({
  head: ({ params }) => ({ meta: [{ title: `Forensic Brief ${params.id} · RAW` }] }),
  component: CaseReportView,
});

const COLORS = [
  "oklch(0.7 0.18 240)", "oklch(0.85 0.16 200)", "oklch(0.78 0.18 75)",
  "oklch(0.78 0.17 155)", "oklch(0.65 0.24 22)", "oklch(0.7 0.15 300)"
];

function CaseReportView() {
  const { id } = Route.useParams();
  const [caseData, setCaseData] = useState<CaseOut | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineEventOut[]>([]);
  const [reports, setReports] = useState<ReportOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, ev, tl, reps] = await Promise.all([
          getCase(id),
          getCaseEvidence(id).catch(() => []),
          getCaseTimeline(id).catch(() => []),
          listReports().catch(() => [])
        ]);
        setCaseData(c);
        setEvidence(ev);
        setTimeline(tl);
        setReports(reps.filter(r => r.case_id === id));
      } catch (err) {
        console.error("Failed to load report data:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff" // crisp white for printed reports
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Case_${id.slice(-8).toUpperCase()}_Report.pdf`);
    } catch (err) {
      console.error("PDF export failed", err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground text-sm flex items-center gap-3">
          <span className="h-5 w-5 border-2 border-muted-foreground/40 border-t-accent rounded-full animate-spin" />
          Compiling Forensic Brief…
        </div>
      </div>
    );
  }

  if (!caseData) return <div className="text-center py-20 text-muted-foreground">Case not found.</div>;

  const riskTone = caseData.risk_score > 70 ? "destructive" : caseData.risk_score > 40 ? "warn" : "cyan";
  
  // Chart Data Preparation
  const evCounts = evidence.reduce((acc, ev) => {
    acc[ev.type] = (acc[ev.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const evidenceMix = Object.entries(evCounts).map(([name, value], i) => ({
    name, value, color: COLORS[i % COLORS.length]
  }));

  const timelineCounts = timeline.reduce((acc, ev) => {
    const d = new Date(ev.timestamp).toLocaleDateString();
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const timelineData = Object.entries(timelineCounts)
    .map(([date, count]) => ({ date, events: count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Link to="/cases_/$id" params={{ id }} className="text-xs text-muted-foreground hover:text-accent inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Back to Case
        </Link>
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="px-4 py-2 rounded-md bg-accent text-accent-foreground text-sm font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> {exporting ? "Generating PDF..." : "Export to PDF"}
        </button>
      </div>

      <div 
        ref={reportRef} 
        className="bg-background text-foreground p-10 border border-border/40 rounded-xl space-y-10"
      >
        {/* Header Block */}
        <div className="border-b border-border/60 pb-6 flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2 flex items-center gap-2">
              <span>RAW Investigation OS</span>
              <span>·</span>
              <span>FORENSIC BRIEF</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{caseData.title}</h1>
            <div className="flex items-center gap-3">
              <Badge tone="cyan">#{id.slice(-8).toUpperCase()}</Badge>
              <Badge>{caseData.crime_type}</Badge>
              <Badge tone={caseData.status === 'open' ? 'success' : 'default'}>{caseData.status.toUpperCase()}</Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Generated On</div>
            <div className="text-sm ticker-mono">{new Date().toLocaleString()}</div>
            <div className="mt-4">
              <Badge tone={riskTone as any} className="text-sm px-3 py-1">
                <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                RISK SCORE: {caseData.risk_score}/100
              </Badge>
            </div>
          </div>
        </div>

        {/* AI Executive Summary */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 uppercase tracking-wide">
            <Activity className="h-5 w-5 text-accent" />
            Executive Summary
          </h2>
          <div className="p-5 rounded-lg border border-border/40 bg-secondary/10 text-sm leading-relaxed whitespace-pre-wrap">
            {caseData.ai_risk_recommendation ? (
              <>
                <p className="font-semibold mb-2 text-accent">AI Risk Analysis:</p>
                <p>{caseData.ai_risk_recommendation}</p>
                {caseData.ai_risk_flags && caseData.ai_risk_flags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {caseData.ai_risk_flags.map((flag, i) => (
                      <Badge key={i} tone="warn">{flag}</Badge>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">No comprehensive AI risk analysis has been generated for this case yet.</p>
            )}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b border-border/40 pb-2">
              Evidence Distribution
            </h2>
            <div className="h-[250px] bg-secondary/10 rounded-lg border border-border/40 p-4">
              {evidence.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={evidenceMix} dataKey="value" innerRadius={40} outerRadius={80} stroke="none">
                      {evidenceMix.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: "#000", borderColor: "#333", borderRadius: "8px" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No Evidence</div>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {evidenceMix.map((e) => (
                <div key={e.name} className="flex items-center gap-1.5 text-xs">
                  <span className="h-2 w-2 rounded-full" style={{ background: e.color }} />
                  <span className="capitalize">{e.name}: {e.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b border-border/40 pb-2">
              Event Activity Over Time
            </h2>
            <div className="h-[250px] bg-secondary/10 rounded-lg border border-border/40 p-4">
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="date" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                    <RechartsTooltip cursor={{ fill: "#222" }} contentStyle={{ backgroundColor: "#000", borderColor: "#333", borderRadius: "8px" }} />
                    <Bar dataKey="events" fill="oklch(0.7 0.18 240)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No Events</div>
              )}
            </div>
          </div>
        </div>

        {/* AI Reports */}
        {reports.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 uppercase tracking-wide">
              <FileText className="h-5 w-5 text-accent" />
              Intelligence Briefs
            </h2>
            <div className="space-y-4">
              {reports.map((r) => (
                <div key={r.id} className="p-5 rounded-lg border border-border/40 bg-secondary/5">
                  <div className="text-xs uppercase text-muted-foreground mb-3 flex justify-between">
                    <span>{r.report_type} REPORT</span>
                    <span className="ticker-mono">{new Date(r.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {r.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chain of Custody Ledger */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 uppercase tracking-wide">
            <Fingerprint className="h-5 w-5 text-accent" />
            Chain of Custody Ledger
          </h2>
          <div className="rounded-lg border border-border/40 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/20 border-b border-border/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Evidence File</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">Cryptographic Hash (SHA-256)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {evidence.length > 0 ? evidence.map((ev) => (
                  <tr key={ev.id} className="bg-background hover:bg-secondary/5">
                    <td className="px-4 py-3 max-w-[200px] truncate" title={ev.path.split("/").pop()}>{ev.path.split("/").pop()}</td>
                    <td className="px-4 py-3"><Badge tone="cyan">{ev.type}</Badge></td>
                    <td className="px-4 py-3 ticker-mono text-[11px] text-muted-foreground">{new Date(ev.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 ticker-mono text-[11px] text-accent select-all">{ev.hash || "Processing..."}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No evidence recorded in ledger.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
