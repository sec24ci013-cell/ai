import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Panel({
  title,
  subtitle,
  right,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("glass rounded-xl border border-border/60 overflow-hidden", className)}>
      {title && (
        <header className="flex items-center justify-between px-4 h-12 border-b border-border/60">
          <div>
            <h3 className="text-xs uppercase tracking-[0.18em] font-semibold">{title}</h3>
            {subtitle && <p className="text-[10px] text-muted-foreground ticker-mono">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function StatCard({
  label, value, delta, accent, icon: Icon,
}: {
  label: string;
  value: string | number;
  delta?: string;
  accent?: "primary" | "cyan" | "warn" | "destructive" | "success";
  icon?: any;
}) {
  const tone =
    accent === "destructive" ? "from-destructive/30 to-destructive/0 text-destructive" :
    accent === "warn" ? "from-warn/30 to-warn/0 text-warn" :
    accent === "success" ? "from-success/30 to-success/0 text-success" :
    accent === "cyan" ? "from-accent/30 to-accent/0 text-accent" :
    "from-primary/30 to-primary/0 text-primary";

  return (
    <div className="relative glass rounded-xl border border-border/60 p-4 overflow-hidden group">
      <div className={cn("absolute -top-12 -right-12 h-32 w-32 rounded-full blur-2xl bg-gradient-to-br opacity-50 group-hover:opacity-80 transition", tone)} />
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
        {Icon && <Icon className={cn("h-4 w-4", tone.split(" ").pop())} />}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        {delta && <div className={cn("text-xs ticker-mono pb-1", tone.split(" ").pop())}>{delta}</div>}
      </div>
      <div className="mt-3 h-1 rounded-full bg-secondary/60 overflow-hidden">
        <div className={cn("h-full w-2/3 bg-gradient-to-r", accent === "destructive" ? "from-destructive to-warn" : "from-primary to-accent")} />
      </div>
    </div>
  );
}

export function Badge({
  children, tone = "default",
}: { children: ReactNode; tone?: "default" | "success" | "warn" | "destructive" | "cyan" }) {
  const map: Record<string, string> = {
    default: "bg-secondary/60 text-muted-foreground border-border",
    success: "bg-success/10 text-success border-success/30",
    warn: "bg-warn/10 text-warn border-warn/30",
    destructive: "bg-destructive/10 text-destructive border-destructive/30",
    cyan: "bg-accent/10 text-accent border-accent/30",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-widest ticker-mono", map[tone])}>
      {children}
    </span>
  );
}

export function PageHeader({ eyebrow, title, desc, actions }: { eyebrow?: string; title: string; desc?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        {eyebrow && <div className="text-[11px] uppercase tracking-[0.22em] text-accent ticker-mono mb-2">{eyebrow}</div>}
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
        {desc && <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{desc}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
