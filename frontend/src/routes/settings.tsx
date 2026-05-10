import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, Panel, Badge } from "@/components/raw/ui";
import { getAuditLogs, setupMFA, verifyMFA, logout } from "@/lib/api";
import { LogOut, Shield, Key } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · RAW" }] }),
  component: Settings,
});

function Settings() {
  const navigate = useNavigate();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [mfaSetup, setMfaSetup] = useState<{ secret: string; qr_code: string } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaMsg, setMfaMsg] = useState("");

  useEffect(() => {
    getAuditLogs(20).then(setAuditLogs).catch(() => { });
  }, []);

  const handleMFASetup = async () => {
    try {
      const data = await setupMFA();
      setMfaSetup(data);
    } catch (err: any) {
      setMfaMsg(err.message);
    }
  };

  const handleMFAVerify = async () => {
    try {
      const result = await verifyMFA(mfaCode);
      setMfaMsg(result.message);
      setMfaSetup(null);
      setMfaCode("");
    } catch (err: any) {
      setMfaMsg(err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="SYSTEM" title="Operator Settings" desc="Workspace preferences, security posture, and AI core configuration." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Session Controls">
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full h-11 rounded-lg bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25 text-sm flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </Panel>

        <Panel title="Security Posture">
          <div className="space-y-3 text-sm">
            <Row k="Session" v="Encrypted · JWT" />
            <Row k="Evidence vault" v="Hash-locked · SHA-256" />
            <div className="pt-2">
              {mfaSetup ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Scan this QR code with your authenticator app, then enter the code below:</p>
                  {mfaSetup.qr_code && (
                    <div className="flex justify-center">
                      <img src={`data:image/png;base64,${mfaSetup.qr_code}`} alt="MFA QR" className="h-32 w-32 rounded" />
                    </div>
                  )}
                  <div className="text-[10px] ticker-mono text-muted-foreground text-center">Secret: {mfaSetup.secret}</div>
                  <div className="flex gap-2">
                    <input
                      type="text" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)}
                      placeholder="6-digit code"
                      className="flex-1 h-9 px-3 rounded-md bg-secondary/40 border border-border/60 text-sm"
                    />
                    <button onClick={handleMFAVerify} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-xs">Verify</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleMFASetup}
                  className="w-full h-9 rounded-md bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 text-xs flex items-center justify-center gap-2"
                >
                  <Shield className="h-3.5 w-3.5" /> Setup MFA
                </button>
              )}
              {mfaMsg && <p className="text-xs text-accent mt-2">{mfaMsg}</p>}
            </div>
          </div>
        </Panel>

        <Panel title="AI Core" className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ["Primary Model", "Qwen/Qwen3-32B"],
              ["Fast Model", "Qwen2.5-7B-Instruct"],
              ["Embedding", "Qwen3-Embedding-8B"],
              ["Provider", "Featherless AI"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-md bg-secondary/30 border border-border/40 p-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div>
                <div className="text-sm font-medium mt-1">{v}</div>
              </div>
            ))}
          </div>
        </Panel>

        {auditLogs.length > 0 && (
          <Panel title="Audit Log" subtitle="RECENT ACTIVITY" className="lg:col-span-2">
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {auditLogs.map((log: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-xs p-2 rounded-md hover:bg-secondary/30">
                  <Key className="h-3 w-3 text-accent" />
                  <span className="ticker-mono text-muted-foreground w-28">{log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}</span>
                  <span className="flex-1">{log.method} {log.path}</span>
                  <span className="ticker-mono text-muted-foreground">{log.status_code}</span>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span>{v}</span>
    </div>
  );
}
