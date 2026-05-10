import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldHalf, LogIn, UserPlus, Eye, EyeOff, Sparkles } from "lucide-react";
import { login, register } from "@/lib/api";

export const Route = createFileRoute("/login")({
    head: () => ({ meta: [{ title: "Access Terminal · RAW" }] }),
    component: LoginPage,
});

function LoginPage() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<"login" | "register">("login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            if (mode === "register") {
                await register(name, email, password);
            }
            await login(email, password);
            navigate({ to: "/" });
        } catch (err: any) {
            setError(err.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
            {/* Background effects */}
            <div className="pointer-events-none fixed inset-0 grid-bg opacity-40" />
            <div className="absolute top-1/4 left-1/3 h-64 w-64 rounded-full bg-primary/20 blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/3 h-48 w-48 rounded-full bg-accent/20 blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="relative w-full max-w-md"
            >
                {/* Branding */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative h-16 w-16 rounded-xl grid place-items-center bg-gradient-to-br from-primary to-accent glow-primary mb-4">
                        <ShieldHalf className="h-8 w-8 text-primary-foreground" />
                        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-success pulse-dot" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight">RAW</h1>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mt-1">
                        Unified Investigation OS
                    </p>
                </div>

                {/* Card */}
                <div className="glass-strong rounded-xl border border-border/60 overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-border/60">
                        {(["login", "register"] as const).map((m) => (
                            <button
                                key={m}
                                onClick={() => { setMode(m); setError(""); }}
                                className={`flex-1 py-3 text-xs uppercase tracking-widest transition ${mode === m
                                        ? "text-foreground border-b-2 border-accent"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {m === "login" ? (
                                    <span className="inline-flex items-center gap-1.5"><LogIn className="h-3.5 w-3.5" />Sign In</span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5"><UserPlus className="h-3.5 w-3.5" />Register</span>
                                )}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {mode === "register" && (
                            <div>
                                <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Operator Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full h-11 px-3 rounded-lg bg-secondary/40 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Detective D. Kaur"
                                />
                            </div>
                        )}
                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full h-11 px-3 rounded-lg bg-secondary/40 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="operator@raw.intel"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Access Key</label>
                            <div className="relative">
                                <input
                                    type={showPw ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={4}
                                    className="w-full h-11 px-3 pr-10 rounded-lg bg-secondary/40 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="••••••••"
                                />
                                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                        >
                            {loading ? (
                                <span className="inline-flex items-center gap-2">
                                    <span className="h-4 w-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                                    Authenticating…
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-2">
                                    <Sparkles className="h-4 w-4" />
                                    {mode === "login" ? "Initialize Session" : "Create Identity"}
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="px-6 pb-4 text-[10px] ticker-mono text-muted-foreground text-center">
                        AES-256 · ENCRYPTED · ZERO-TRUST PERIMETER
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
