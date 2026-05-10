import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, FileText } from "lucide-react";
import { PageHeader, Panel, Badge } from "@/components/raw/ui";
import { searchSemantic, searchKeyword } from "@/lib/api";

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "Search Engine · RAW" }] }),
  component: SearchPage,
});

const TABS = [
  { id: "semantic", label: "Semantic" },
  { id: "keyword", label: "Keyword" },
];

function SearchPage() {
  const [tab, setTab] = useState("semantic");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [totalTime, setTotalTime] = useState(0);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    const start = Date.now();
    try {
      if (tab === "semantic") {
        const data = await searchSemantic(q);
        setResults(data.results || []);
      } else {
        const data = await searchKeyword(q);
        setResults(data.results || []);
      }
    } catch (err) {
      console.error("Search failed:", err);
      setResults([]);
    } finally {
      setTotalTime(Date.now() - start);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="INTELLIGENCE QUERY" title="Universal Search" desc="Semantic and keyword search across the entire evidence corpus." />

      <Panel className="!p-0">
        <form onSubmit={handleSearch} className="p-4 border-b border-border/60">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-accent" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search evidence, cases, entities…"
              className="w-full h-14 pl-12 pr-4 rounded-lg bg-secondary/40 border border-border/60 text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition ${tab === t.id
                    ? "bg-primary/15 text-foreground border-primary/40"
                    : "bg-secondary/30 text-muted-foreground border-border/60 hover:text-foreground"
                  }`}
              >
                {t.id === "semantic" ? <Sparkles className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                {t.label}
              </button>
            ))}
            {searched && (
              <div className="ml-auto flex items-center gap-2 text-[10px] ticker-mono text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" />
                {results.length} results · {totalTime} ms
              </div>
            )}
          </div>
        </form>

        <div className="p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <span className="h-5 w-5 border-2 border-muted-foreground/40 border-t-accent rounded-full animate-spin" />
              <span className="ml-3 text-sm text-muted-foreground">Searching intelligence corpus…</span>
            </div>
          ) : results.length > 0 ? (
            results.map((r: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-lg border border-border/60 bg-secondary/20 hover:bg-secondary/40 p-3 flex items-start gap-3 cursor-pointer"
              >
                <div className="h-9 w-9 rounded bg-gradient-to-br from-primary/30 to-accent/30 grid place-items-center">
                  <Sparkles className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">{r.summary || r.title || r.type || "Result"}</div>
                  <div className="text-[10px] ticker-mono text-muted-foreground mt-0.5">
                    {r.evidence_id ? `Evidence: ${r.evidence_id.slice(-8)}` : ""}
                    {r.case_id ? ` · Case: ${r.case_id.slice(-8)}` : ""}
                    {r.type ? ` · ${r.type}` : ""}
                  </div>
                </div>
                {r.relevance_score && (
                  <Badge tone={r.relevance_score > 5 ? "destructive" : "warn"}>
                    {typeof r.relevance_score === "number" ? r.relevance_score.toFixed(1) : r.relevance_score}
                  </Badge>
                )}
              </motion.div>
            ))
          ) : searched ? (
            <p className="text-center py-10 text-muted-foreground text-sm">No results found. Try a different query.</p>
          ) : (
            <p className="text-center py-10 text-muted-foreground text-sm">Enter a query to search the intelligence corpus.</p>
          )}
        </div>
      </Panel>
    </div>
  );
}
