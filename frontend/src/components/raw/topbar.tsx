import { Bell, Search, Sparkles, ShieldCheck, Activity, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { logout } from "@/lib/api";

export function RawTopbar() {
  const navigate = useNavigate();

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value.trim()) {
      navigate({ to: "/search" });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-30 h-[64px] glass-strong border-b border-border/60">
      <div className="h-full px-5 flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-accent" />
          CLEARANCE · TIER-IV
        </div>

        <div className="flex-1 max-w-2xl mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search cases, suspects, evidence…  ⌘K"
            onKeyDown={handleSearch}
            className="w-full h-10 pl-10 pr-24 rounded-md bg-secondary/50 border border-border/60 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/40"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] ticker-mono text-muted-foreground border border-border rounded px-1.5 py-0.5">
            SEMANTIC
          </kbd>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md glass text-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="text-muted-foreground">AI</span>
            <span className="text-success">ONLINE</span>
          </div>

          <button className="relative h-9 w-9 grid place-items-center rounded-md glass hover:text-accent transition">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
          </button>

          <button onClick={handleLogout} className="h-9 w-9 grid place-items-center rounded-md glass hover:text-destructive transition" title="Sign Out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
