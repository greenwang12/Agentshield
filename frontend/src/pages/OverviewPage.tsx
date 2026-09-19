import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  Bot,
  CheckCircle2,
  Database,
  FileSearch,
  Gauge,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro, SectionCard, ErrorState } from "@/components/agentshield/page-shell";
import { LoadingState } from "@/components/agentshield/loading-state";
import { RiskMeter, StatusPill } from "@/components/agentshield/status";
import { getMetrics } from "@/services/metrics";
import { traces } from "@/mocks/agentshield";
import type { MetricSummary } from "@/types/agentshield";
import { formatDateTime } from "@/utils/format";
import { cn } from "@/lib/utils";

const pipeline = [
  {
    id: "request",
    label: "REQUEST",
    icon: FileSearch,
    status: "Received",
    latency: "0 ms",
    detail: "User intent enters the protected runtime boundary.",
  },
  {
    id: "agent",
    label: "AGENT",
    icon: Bot,
    status: "Generated",
    latency: "341 ms",
    detail: "The autonomous agent returns a response or structured action proposal.",
  },
  {
    id: "moss",
    label: "MOSS",
    icon: Database,
    status: "Retrieved",
    latency: "25 ms",
    detail: "Moss retrieves trusted evidence and relevant security policies in parallel.",
  },
  {
    id: "policy",
    label: "POLICY ENGINE",
    icon: ShieldCheck,
    status: "Matched",
    latency: "23 ms",
    detail:
      "Policies are selected for relevance, privacy, action safety, finance, and communication.",
  },
  {
    id: "risk",
    label: "RISK ENGINE",
    icon: Gauge,
    status: "Scored",
    latency: "921 ms",
    detail: "AgentShield evaluates violations, confidence, action type, and execution risk.",
  },
  {
    id: "decision",
    label: "DECISION",
    icon: CheckCircle2,
    status: "Review",
    latency: "946 ms",
    detail: "The runtime returns APPROVE, REVIEW, or BLOCK with a reason and policy evidence.",
  },
  {
    id: "tool",
    label: "TOOL",
    icon: Wrench,
    status: "Held",
    latency: "—",
    detail: "Tool execution proceeds only when AgentShield allows it.",
  },
] as const;

export function OverviewPage() {
  const [selectedStage, setSelectedStage] = useState<(typeof pipeline)[number]>(pipeline[2]);
  const [metrics, setMetrics] = useState<MetricSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestTrace = traces[0];

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getMetrics();
      setMetrics(data.overview);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Metrics could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const selectedEvidence = latestTrace?.evidence[0];
  const selectedPolicy = latestTrace?.policies[0];
  const toneMap = useMemo(
    () => ({ good: "success", warn: "warning", danger: "danger", neutral: "info" }) as const,
    [],
  );

  return (
    <div className="animate-page-in space-y-6">
      <PageIntro
        title="AgentShield"
        description="AI reliability infrastructure for autonomous agents"
      >
        <StatusPill label="Operational" tone="success" pulse />
      </PageIntro>

      {error ? <ErrorState message={error} onRetry={load} /> : null}

      <section className="rounded-lg border border-border bg-card p-5 shadow-panel">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="text-base font-semibold text-foreground">Runtime pipeline</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Click a stage to inspect how AgentShield makes the current decision.
            </p>
          </div>
          <StatusPill label="Latest trace: REVIEW" tone="warning" />
        </div>
        <div className="grid gap-3 md:grid-cols-7">
          {pipeline.map((stage, index) => {
            const Icon = stage.icon;
            const active = selectedStage.id === stage.id;
            return (
              <div key={stage.id} className="relative">
                <button
                  className={cn(
                    "group min-h-32 w-full rounded-lg border border-border bg-surface-subtle p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active && "border-info/40 bg-info-soft shadow-soft",
                    !active && "hover:border-info/25 hover:bg-secondary",
                  )}
                  onClick={() => setSelectedStage(stage)}
                  aria-pressed={active}
                >
                  <Icon
                    className={cn("h-5 w-5 text-muted-foreground", active && "text-info")}
                    aria-hidden="true"
                  />
                  <p className="mt-4 text-xs font-semibold text-foreground">{stage.label}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{stage.status}</p>
                  <p className="mt-2 text-xs font-medium text-info">{stage.latency}</p>
                </button>
                {index < pipeline.length - 1 ? (
                  <ArrowDown
                    className="mx-auto my-1 h-4 w-4 text-muted-foreground md:hidden"
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="mt-5 grid gap-4 rounded-lg border border-border bg-surface-subtle p-4 lg:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Selected stage</p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">{selectedStage.label}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedStage.detail}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Relevant evidence</p>
            <p className="mt-2 text-sm leading-6 text-foreground">
              {selectedEvidence?.content ?? "No evidence was required for this stage."}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Relevant policy</p>
            <p className="mt-2 text-sm leading-6 text-foreground">
              {selectedPolicy
                ? `${selectedPolicy.id}: ${selectedPolicy.description}`
                : "No policy matched."}
            </p>
          </div>
        </div>
      </section>

      {loading ? (
        <LoadingState message="Loading local runtime measurements..." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-lg border border-border bg-card p-4 shadow-soft transition-transform duration-200 hover:-translate-y-0.5"
            >
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="mt-3 text-2xl font-semibold text-foreground">{metric.value}</p>
              <StatusPill label={metric.delta} tone={toneMap[metric.tone]} />
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <SectionCard
          title="Recent activity"
          description="Latest protected agent requests and actions."
        >
          <div className="space-y-3">
            {traces.slice(0, 5).map((trace) => (
              <div
                key={trace.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-surface-subtle p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusPill
                      label={trace.decision}
                      tone={
                        trace.decision === "APPROVE"
                          ? "success"
                          : trace.decision === "REVIEW"
                            ? "warning"
                            : "danger"
                      }
                    />
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(trace.timestamp)}
                    </span>
                  </div>
                  <p className="truncate text-sm font-medium text-foreground">{trace.user_input}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{trace.reason}</p>
                </div>
                <div className="w-full md:w-40">
                  <RiskMeter risk={trace.risk} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Decision distribution" description="Current local mock runtime mix.">
          <div className="space-y-4">
            <RiskMeter risk={latestTrace?.risk ?? 0} />
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-md bg-success-soft p-3 text-success">
                <strong className="block text-xl">41</strong>Approve
              </div>
              <div className="rounded-md bg-warning-soft p-3 text-warning">
                <strong className="block text-xl">18</strong>Review
              </div>
              <div className="rounded-md bg-danger-soft p-3 text-danger">
                <strong className="block text-xl">6</strong>Block
              </div>
            </div>
            <Button asChild variant="secondary" className="w-full">
              <a href="/live-agent">Open Live Agent</a>
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
