import { motion } from "framer-motion";
import { AlertTriangle, Eye, Fingerprint, MapPin, Phone, Radio, Cctv } from "lucide-react";

const FEED = [
  { t: "00:14", icon: AlertTriangle, color: "text-destructive", title: "Anomaly · Quadrant 7", sub: "Behavioral deviation 92%" },
  { t: "00:11", icon: Cctv, color: "text-accent", title: "Face match · CAM-12", sub: "Confidence 87%" },
  { t: "00:08", icon: Phone, color: "text-warn", title: "Call burst detected", sub: "Suspect M.A · 4 calls / 6m" },
  { t: "00:03", icon: MapPin, color: "text-accent", title: "GPS handoff", sub: "Subject crossed perimeter" },
  { t: "23:58", icon: Fingerprint, color: "text-success", title: "Evidence hashed", sub: "SHA-256 verified" },
  { t: "23:54", icon: Radio, color: "text-muted-foreground", title: "Comms intercepted", sub: "Encrypted · queued" },
  { t: "23:49", icon: Eye, color: "text-warn", title: "Surveillance alert", sub: "Loiter > 8m at gate" },
];

export function ActivityFeed() {
  return (
    <div className="glass rounded-xl border border-border/60 h-full flex flex-col">
      <div className="px-4 h-12 flex items-center justify-between border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-70 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
          </span>
          <h3 className="text-xs uppercase tracking-[0.18em] font-semibold">Live Intel Feed</h3>
        </div>
        <span className="text-[10px] ticker-mono text-muted-foreground">REALTIME</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {FEED.map((e, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="group flex items-start gap-3 px-3 py-2 rounded-md hover:bg-secondary/40 cursor-pointer"
          >
            <div className="ticker-mono text-[10px] text-muted-foreground pt-0.5 w-10 shrink-0">{e.t}</div>
            <e.icon className={`h-4 w-4 mt-0.5 ${e.color}`} />
            <div className="min-w-0">
              <div className="text-xs font-medium truncate">{e.title}</div>
              <div className="text-[11px] text-muted-foreground truncate">{e.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
