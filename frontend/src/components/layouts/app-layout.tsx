import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpenText,
  Bot,
  Database,
  FileSearch,
  Gauge,
  Menu,
  Settings,
  ShieldCheck,
  TerminalSquare,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { StatusPill } from "@/components/agentshield/status";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Overview", icon: Gauge },
  { to: "/live-agent", label: "Live Agent", icon: Bot },
  { to: "/actions", label: "Actions", icon: Zap },
  { to: "/incidents", label: "Incidents", icon: AlertTriangle },
  { to: "/policies", label: "Policies", icon: BookOpenText },
  { to: "/evidence", label: "Evidence", icon: Database },
  { to: "/performance", label: "Performance", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const titles: Record<string, string> = {
  "/": "Overview",
  "/live-agent": "Live Agent",
  "/actions": "Actions",
  "/incidents": "Incidents",
  "/policies": "Policies",
  "/evidence": "Evidence",
  "/performance": "Performance",
  "/settings": "Settings",
};

function Brand() {
  return (
    <Link
      to="/"
      className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="grid h-10 w-10 place-items-center rounded-lg border border-info/20 bg-info-soft text-info shadow-soft">
        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-sm font-semibold text-foreground">AgentShield</span>
        <span className="block text-xs text-muted-foreground">Reliability Control Plane</span>
      </span>
    </Link>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-5">
        <Brand />
      </div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive && "bg-secondary text-foreground shadow-soft",
                !isActive && "hover:bg-surface-subtle hover:text-foreground",
              )}
            >
              <Icon
                className={cn("h-4 w-4 transition-colors", isActive && "text-info")}
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="space-y-3 border-t border-border p-4">
        <div className="rounded-lg border border-border bg-surface-subtle p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Runtime</span>
            <StatusPill label="LOCAL" tone="info" />
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm font-medium text-foreground">
            <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
            System Operational
          </div>
        </div>
      </div>
    </div>
  );
}

function TopBar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const title = titles[pathname] ?? "AgentShield";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] border-border bg-card p-0">
              <SheetTitle className="sr-only">AgentShield navigation</SheetTitle>
              <SidebarNav />
            </SheetContent>
          </Sheet>
          <div>
            <p className="text-xs uppercase text-muted-foreground">AgentShield</p>
            <h1 className="text-lg font-semibold text-foreground md:text-xl">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill label="LOCAL" tone="info" />
          <StatusPill label="Operational" tone="success" pulse />
          <div className="hidden items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground md:flex">
            <Activity className="h-3.5 w-3.5 text-success" aria-hidden="true" />
            956 ms avg
          </div>
          <Button variant="ghost" size="icon" aria-label="Profile and settings">
            <TerminalSquare className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-border bg-card/70 backdrop-blur-xl lg:block">
        <SidebarNav />
      </div>
      <div className="lg:pl-72">
        <TopBar />
        <main className="mx-auto w-full max-w-[1500px] px-4 py-5 lg:px-6 lg:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
