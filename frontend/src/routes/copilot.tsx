import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles, Send } from "lucide-react";
import { PageHeader, Panel, Badge } from "@/components/raw/ui";
import { askCopilotStream, listCases, type CaseOut } from "@/lib/api";

export const Route = createFileRoute("/copilot")({
  head: () => ({ meta: [{ title: "AI Copilot · RAW" }] }),
  component: Copilot,
});

function Copilot() {
  const [cases, setCases] = useState<CaseOut[]>([]);
  const [selectedCase, setSelectedCase] = useState("general");
  const [msgs, setMsgs] = useState<Array<{ role: "user" | "ai"; text: string }>>([
    { role: "ai", text: "Ready for investigation queries. Select a case for context-aware analysis, or ask a general question." },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<Array<{ question: string; answer: string }>>([]);

  useEffect(() => { listCases().then(setCases).catch(() => { }); }, []);
  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [msgs]);

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    setStreaming(true);

    let response = "";
    setMsgs((m) => [...m, { role: "ai", text: "▌" }]);

    try {
      await askCopilotStream(
        selectedCase,
        text,
        historyRef.current,
        (token) => {
          response += token;
          setMsgs((m) => {
            const updated = [...m];
            updated[updated.length - 1] = { role: "ai", text: response + "▌" };
            return updated;
          });
        },
        () => {
          setMsgs((m) => {
            const updated = [...m];
            updated[updated.length - 1] = { role: "ai", text: response || "Analysis complete." };
            return updated;
          });
          historyRef.current.push({ question: text, answer: response });
          setStreaming(false);
        }
      );
    } catch {
      setMsgs((m) => {
        const updated = [...m];
        updated[updated.length - 1] = { role: "ai", text: "**Connection to AI core interrupted.** The backend service may not be running." };
        return updated;
      });
      setStreaming(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="REASONING ENGINE"
        title="AI Investigation Copilot"
        desc="Conversational intelligence with multi-step reasoning, evidence citation, and case-aware memory."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={selectedCase}
              onChange={(e) => setSelectedCase(e.target.value)}
              className="h-9 px-3 rounded-md bg-secondary/40 border border-border/60 text-xs"
            >
              <option value="general">General Query</option>
              {cases.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <Badge tone="success">● ONLINE</Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Chat */}
        <Panel className="lg:col-span-3 !p-0 flex flex-col" title="Conversation" subtitle="NEURAL CORE 4.2">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[500px] min-h-[400px]">
            {msgs.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={m.role === "user" ? "flex justify-end" : ""}
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[80%] rounded-lg px-4 py-3 text-sm bg-primary text-primary-foreground"
                      : "max-w-[85%] rounded-lg px-4 py-3 text-sm bg-secondary/50 border border-border/60"
                  }
                  dangerouslySetInnerHTML={{
                    __html: m.text
                      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-accent">$1</strong>')
                      .replace(/\*(.+?)\*/g, '<em class="text-foreground/80">$1</em>')
                      .replace(/\n/g, "<br />"),
                  }}
                />
              </motion.div>
            ))}
          </div>

          <div className="px-3 pb-2 flex flex-wrap gap-1.5">
            {[
              "Summarize this case",
              "What evidence gaps exist?",
              "Generate a risk assessment",
              "Who are the key suspects?",
            ].map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={streaming}
                className="text-[11px] px-2 py-1 rounded-full bg-secondary/50 border border-border/60 hover:border-accent/50 hover:text-accent disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="p-3 border-t border-border/60 flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the Copilot…"
              disabled={streaming}
              className="flex-1 h-12 px-4 rounded-lg bg-secondary/50 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={streaming}
              className="h-12 w-12 grid place-items-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </Panel>

        {/* Sidebar capabilities */}
        <div className="space-y-4">
          <Panel title="Capabilities">
            <div className="space-y-3">
              {[
                ["Cross-modal correlation", "Fuse CCTV, GPS, comms, biometrics into one reasoning trace."],
                ["Evidence citation", "Every claim references a tamper-evident chain entry."],
                ["Hypothesis ranking", "Generate, score and stress-test investigative hypotheses."],
                ["Auto-brief generation", "Produce courtroom-ready synopsis on demand."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    <h4 className="text-xs font-medium">{t}</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{d}</p>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Tip">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Bot className="h-4 w-4 text-accent" />
              Use the floating Copilot orb (bottom right) to chat from anywhere in the OS.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
