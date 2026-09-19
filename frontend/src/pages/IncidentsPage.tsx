import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bot,
  CheckCircle2,
  Database,
  FileWarning,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { PageIntro, SectionCard, ErrorState } from "@/components/agentshield/page-shell";
import { LoadingState } from "@/components/agentshield/loading-state";
import { RiskMeter, StatusPill, toneFromDecision } from "@/components/agentshield/status";
import { getTraces } from "@/services/traces";
import type { Trace } from "@/types/agentshield";
import { formatDateTime } from "@/utils/format";
import { cn } from "@/lib/utils";

const timeline = [
  { label: "Request received", icon: Activity },
  { label: "Agent response generated", icon: Bot },
  { label: "Moss retrieved context", icon: Database },
  { label: "Policy evaluation", icon: ShieldCheck },
  { label: "AgentShield decision", icon: FileWarning },
  { label: "Action execution / rejection", icon: Wrench },
];

export function IncidentsPage() {
  const [items, setItems] = useState<Trace[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getTraces();
      setItems(data);
      setSelectedId((prev) => prev ?? data[0]?.id ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Incidents could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? items[0],
    [items, selectedId],
  );

  return (
    <div className="animate-page-in space-y-6">
      <PageIntro
        eyebrow="Runtime investigation"
        title="Incidents"
        description="Investigate blocked and reviewed traces with evidence, policies, decisions, action parameters, and execution state."
      />
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {loading ? <LoadingState message="Loading incident traces..." /> : null}
      {!loading && !error ? (
        <div className="grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
          <SectionCard
            title="Incident list"
            description="Select a trace to inspect the full decision path."
          >
            <div className="space-y-3">
              {items.map((trace) => (
                <button
                  key={trace.id}
                  onClick={() => setSelectedId(trace.id)}
                  className={cn(
                    "w-full rounded-lg border border-border bg-surface-subtle p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:border-info/30",
                    selected?.id === trace.id && "border-info/40 bg-info-soft",
                  )}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-info">{trace.id}</span>
                    <StatusPill label={trace.decision} tone={toneFromDecision(trace.decision)} />
                  </div>
                  <p className="line-clamp-2 text-sm font-medium text-foreground">
                    {trace.user_input}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDateTime(trace.timestamp)} · {trace.intent}
                  </p>
                </button>
              ))}
            </div>
          </SectionCard>

          {selected ? (
            <div className="space-y-6">
              <SectionCard
                title="Detailed investigation"
                description="Evidence-backed AgentShield decision record."
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-border bg-surface-subtle p-4">
                    <p className="text-xs uppercase text-muted-foreground">User request</p>
                    <p className="mt-2 text-sm leading-6 text-foreground">{selected.user_input}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-surface-subtle p-4">
                    <p className="text-xs uppercase text-muted-foreground">
                      Agent response / action
                    </p>
                    <p className="mt-2 text-sm leading-6 text-foreground">
                      {selected.agent_output}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-surface-subtle p-4">
                    <p className="text-xs uppercase text-muted-foreground">AgentShield decision</p>
                    <div className="mt-2 flex items-center gap-2">
                      <StatusPill
                        label={selected.decision}
                        tone={toneFromDecision(selected.decision)}
                      />
                      <StatusPill
                        label={selected.verdict}
                        tone={toneFromDecision(selected.decision)}
                      />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {selected.reason}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-surface-subtle p-4">
                    <RiskMeter risk={selected.risk} />
                    <p className="mt-3 text-sm text-muted-foreground">
                      Execution status:{" "}
                      <span className="font-medium text-foreground">
                        {selected.executed ? "Executed" : "Not executed"}
                      </span>
                    </p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Decision timeline"
                description="How this trace moved through the runtime."
              >
                <ol className="relative space-y-4 before:absolute before:left-5 before:top-4 before:h-[calc(100%-2rem)] before:w-px before:bg-border">
                  {timeline.map((item, index) => {
                    const Icon = item.icon;
                    const final = index === timeline.length - 1;
                    return (
                      <li key={item.label} className="relative flex gap-4">
                        <span
                          className={cn(
                            "z-10 grid h-10 w-10 place-items-center rounded-full border border-border bg-secondary",
                            final && selected.decision === "BLOCK" && "bg-danger-soft text-danger",
                            final &&
                              selected.decision === "REVIEW" &&
                              "bg-warning-soft text-warning",
                            final &&
                              selected.decision === "APPROVE" &&
                              "bg-success-soft text-success",
                          )}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="flex-1 rounded-lg border border-border bg-surface-subtle p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-foreground">{item.label}</h3>
                            <span className="text-xs text-muted-foreground">
                              {index === 0
                                ? "0 ms"
                                : index === 2
                                  ? `${selected.latency.parallel_retrieval_ms} ms`
                                  : index === 4
                                    ? `${selected.latency.total_guardrail_ms} ms`
                                    : "complete"}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {index === 0 && selected.user_input}
                            {index === 1 && selected.agent_output}
                            {index === 2 &&
                              `${selected.evidence.length} evidence documents retrieved by Moss.`}
                            {index === 3 &&
                              `${selected.policies.length} policies checked: ${selected.policies.map((policy) => policy.id).join(", ")}.`}
                            {index === 4 && `${selected.decision}: ${selected.reason}`}
                            {index === 5 &&
                              (selected.executed
                                ? "The action completed after approval."
                                : "The action remained held or rejected.")}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </SectionCard>

              <div className="grid gap-6 lg:grid-cols-2">
                <SectionCard title="Policy violations">
                  <div className="space-y-3">
                    {selected.policies.map((policy) => (
                      <div
                        key={policy.id}
                        className="rounded-md border border-border bg-surface-subtle p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs text-info">{policy.id}</span>
                          <StatusPill
                            label={policy.severity}
                            tone={policy.severity === "Critical" ? "danger" : "warning"}
                          />
                        </div>
                        <p className="mt-2 text-sm leading-5 text-muted-foreground">
                          {policy.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
                <SectionCard title="Verified evidence and latency">
                  <div className="space-y-3">
                    {selected.evidence.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-md border border-border bg-surface-subtle p-3"
                      >
                        <p className="font-mono text-xs text-info">{item.documentId}</p>
                        <p className="mt-2 text-sm leading-5 text-muted-foreground">
                          {item.content}
                        </p>
                      </div>
                    ))}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                      <span className="rounded-md bg-secondary p-2">
                        Moss {selected.latency.parallel_retrieval_ms} ms
                      </span>
                      <span className="rounded-md bg-secondary p-2">
                        Eval {selected.latency.evaluation_ms} ms
                      </span>
                      <span className="rounded-md bg-secondary p-2">
                        Total {selected.latency.total_guardrail_ms} ms
                      </span>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
