import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard, FolderKanban, Upload, Clock4, Cctv, Bot, Network,
  Search, Mic, FileText, Settings, ShieldHalf, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/cases", label: "Active Cases", icon: FolderKanban },
  { to: "/evidence", label: "Evidence Upload", icon: Upload },
  { to: "/timeline", label: "Timeline", icon: Clock4 },
  { to: "/cctv", label: "CCTV Analytics", icon: Cctv },
  { to: "/copilot", label: "AI Copilot", icon: Bot },
  { to: "/graph", label: "Graph Intelligence", icon: Network },
  { to: "/search", label: "Search Engine", icon: Search },
  { to: "/voice", label: "Voice Assistant", icon: Mic },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/supervisor", label: "Supervisor", icon: Bot },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function RawSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      className={cn(
        "relative shrink-0 transition-[width] duration-300 ease-out",
        collapsed ? "w-[72px]" : "w-[252px]",
      )}
    >
      <div className="sticky top-0 h-screen flex flex-col glass-strong border-r border-border/60">
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 h-[64px] border-b border-border/60">
          <div className="relative h-9 w-9 rounded-md grid place-items-center bg-gradient-to-br from-primary to-accent glow-primary">
            <ShieldHalf className="h-5 w-5 text-primary-foreground" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-success pulse-dot" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-[15px] font-semibold tracking-wide">RAW</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Investigation OS
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map((item) => {
            const active = path === item.to || (item.to !== "/" && path.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-accent glow-cyan"
                  />
                )}
                <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-accent")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && active && (
                  <span className="ml-auto text-[10px] font-mono text-accent">●</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Status */}
        {!collapsed && (
          <div className="m-3 rounded-lg p-3 glass border border-border/60">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" />
              System Online
            </div>
            <div className="mt-1.5 text-[11px] ticker-mono text-muted-foreground">
              NODES 14 / LATENCY 38ms
            </div>
            <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
              <div className="h-full w-[78%] bg-gradient-to-r from-primary to-accent" />
            </div>
          </div>
        )}

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-20 z-20 h-6 w-6 grid place-items-center rounded-full glass-strong border border-border hover:text-accent"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </div>
    </aside>
  );
}
