import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles } from "lucide-react";
import { askCopilotStream, isAuthenticated } from "@/lib/api";

const SUGGEST = [
  "Summarize this case",
  "Find anomalies in the evidence",
  "List all suspects and connections",
  "What are the key risk factors?",
];

const SEED: Array<{ role: "ai" | "user"; text: string }> = [
  { role: "ai", text: "Ready for investigation queries. Select a case to begin analysis, or ask a general question." },
];

export function AICopilot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState(SEED);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [caseId, setCaseId] = useState("general");
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversationHistory = useRef<Array<{ question: string; answer: string }>>([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs]);

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    setStreaming(true);

    // Try to use the real API
    if (isAuthenticated()) {
      let response = "";
      setMsgs((m) => [...m, { role: "ai", text: "▌" }]);

      try {
        await askCopilotStream(
          caseId,
          text,
          conversationHistory.current,
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
              updated[updated.length - 1] = { role: "ai", text: response || "Analysis complete. No additional data found." };
              return updated;
            });
            conversationHistory.current.push({ question: text, answer: response });
            setStreaming(false);
          }
        );
      } catch {
        // Fallback to mock response on error
        setMsgs((m) => {
          const updated = [...m];
          updated[updated.length - 1] = {
            role: "ai",
            text: "**Connection to AI core interrupted.** The backend service may be offline. Running in local analysis mode."
          };
          return updated;
        });
        setStreaming(false);
      }
    } else {
      // Mock fallback
      setTimeout(() => {
        setMsgs((m) => [
          ...m,
          {
            role: "ai",
            text: "Please **sign in** to enable AI analysis. The copilot requires authentication to access case intelligence.",
          },
        ]);
        setStreaming(false);
      }, 500);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full grid place-items-center glow-primary bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground"
      >
        <Bot className="h-6 w-6" />
        <span className="absolute inset-0 rounded-full border border-accent/40 animate-ping" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-40 w-[400px] max-w-[calc(100vw-2rem)] h-[540px] rounded-xl glass-strong border border-border overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-4 h-12 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="relative h-7 w-7 rounded-md grid place-items-center bg-gradient-to-br from-primary to-accent">
                  <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold">RAW Copilot</div>
                  <div className="text-[10px] ticker-mono text-success">● NEURAL CORE v4.2</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  placeholder="Case ID"
                  className="w-20 h-6 px-1.5 text-[10px] rounded bg-secondary/50 border border-border/60 ticker-mono text-muted-foreground"
                  title="Enter a Case ID for context-aware queries"
                />
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgs.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[85%] rounded-lg px-3 py-2 text-sm bg-primary text-primary-foreground"
                        : "max-w-[90%] rounded-lg px-3 py-2 text-sm bg-secondary/50 border border-border/60"
                    }
                    dangerouslySetInnerHTML={{
                      __html: m.text
                        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-accent">$1</strong>')
                        .replace(/\*(.+?)\*/g, '<em class="text-foreground/80">$1</em>'),
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {SUGGEST.map((s) => (
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
                className="flex-1 h-10 px-3 rounded-md bg-secondary/50 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={streaming}
                className="h-10 w-10 grid place-items-center rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
