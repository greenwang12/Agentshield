import { ArrowRight, Bot, Database, Gauge, ShieldCheck, Wrench } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const architecture = [
  { label: "Agent", icon: Bot },
  { label: "Moss", icon: Database },
  { label: "Policy Engine", icon: ShieldCheck },
  { label: "Risk Engine", icon: Gauge },
  { label: "Decision", icon: ShieldCheck },
  { label: "Tool", icon: Wrench },
];

export function OnboardingPage({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="grid min-h-[calc(100vh-7rem)] place-items-center px-2 py-8">
      <div className="w-full max-w-4xl rounded-lg border border-border bg-card p-6 shadow-panel md:p-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-lg border border-info/20 bg-info-soft text-info">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
            Welcome to AgentShield
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Protect, validate, and monitor AI agent behavior in real time.
          </p>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-6">
          {architecture.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.label}
                className="relative rounded-lg border border-border bg-surface-subtle p-4 text-center"
              >
                <Icon className="mx-auto h-5 w-5 text-info" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-foreground">{stage.label}</p>
                {index < architecture.length - 1 ? (
                  <ArrowRight
                    className="absolute -right-4 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground md:block"
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild onClick={onDismiss}>
            <Link to="/live-agent">Explore Live Agent</Link>
          </Button>
          <Button asChild variant="secondary" onClick={onDismiss}>
            <Link to="/policies">View Policies</Link>
          </Button>
          <Button asChild variant="outline" onClick={onDismiss}>
            <Link to="/incidents">Inspect Runtime</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
