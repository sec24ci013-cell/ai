import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter, useRouterState, HeadContent, Scripts,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import appCss from "../styles.css?url";
import { RawSidebar } from "@/components/raw/sidebar";
import { RawTopbar } from "@/components/raw/topbar";
import { AICopilot } from "@/components/raw/copilot";
import { ActivityFeed } from "@/components/raw/activity-feed";
import { isAuthenticated } from "@/lib/api";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center glass-strong rounded-xl border border-border p-10">
        <div className="text-[11px] uppercase tracking-[0.3em] text-accent ticker-mono">Signal lost</div>
        <h1 className="mt-3 text-6xl font-semibold tracking-tight">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">Coordinates not found in the intelligence grid.</p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center glass-strong rounded-xl border border-border p-10">
        <h1 className="text-xl font-semibold tracking-tight">System fault detected</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >Re-initialize</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: "RAW · Unified Investigation OS" },
        { name: "description", content: "AI-native forensic investigation operating system." },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" },
      ],
    }),
    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
  }
);

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  const isLoginPage = path === "/login";

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!isLoginPage && !isAuthenticated()) {
        router.navigate({ to: "/login" });
      }
      setAuthChecked(true);
    }
  }, [path, isLoginPage, router]);

  // On login page, render without shell
  if (isLoginPage) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="relative min-h-screen">
          <div className="pointer-events-none fixed inset-0 grid-bg opacity-60" />
          <Outlet />
        </div>
      </QueryClientProvider>
    );
  }

  // Wait for auth check before rendering full app shell
  if (!authChecked) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative min-h-screen flex">
        <div className="pointer-events-none fixed inset-0 grid-bg opacity-60" />
        <RawSidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <RawTopbar />
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 p-4">
            <main className="min-w-0"><Outlet /></main>
            <aside className="hidden xl:block"><div className="sticky top-[80px] h-[calc(100vh-96px)]"><ActivityFeed /></div></aside>
          </div>
        </div>
        <AICopilot />
      </div>
    </QueryClientProvider>
  );
}
