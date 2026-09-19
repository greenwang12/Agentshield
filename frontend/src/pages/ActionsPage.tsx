import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ExternalLink, Filter, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro, SectionCard, ErrorState } from "@/components/agentshield/page-shell";
import { LoadingState } from "@/components/agentshield/loading-state";
import { RiskMeter, StatusPill, toneFromDecision } from "@/components/agentshield/status";
import { getActions } from "@/services/actions";
import type { ActionProposal, Decision, Trace } from "@/types/agentshield";
import { cn } from "@/lib/utils";

type ActionRow = {
  action: ActionProposal;
  trace: Trace | null;
  status: Decision;
};

const filters = ["All", "Approved", "Review", "Blocked"] as const;

export function ActionsPage() {
  const [items, setItems] = useState<ActionRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const data = await getActions();
      const rows = Array.isArray(data) ? data : [];

      setItems(rows);
      setSelectedId((prev) => prev ?? rows[0]?.action.id ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Actions could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "All") return items;

    return items.filter((item) => item.status === filter.toUpperCase());
  }, [filter, items]);

  const selected = filtered.find((item) => item.action.id === selectedId) ?? filtered[0];

  return (
    <div className="animate-page-in space-y-6">
      <PageIntro
        eyebrow="Action security center"
        title="Actions"
        description="Monitor tool proposals, execution state, triggered policies, and risk before anything leaves the agent boundary."
      />

      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {loading ? <LoadingState message="Loading action security state..." /> : null}

      {!loading && !error ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
          <SectionCard
            title="Protected actions"
            description="Filter by current AgentShield decision."
            action={<Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
          >
            <div
              className="mb-4 flex flex-wrap gap-2"
              role="tablist"
              aria-label="Action decision filters"
            >
              {filters.map((item) => (
                <Button
                  key={item}
                  variant={filter === item ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(item)}
                >
                  {item}
                </Button>
              ))}
            </div>

            <div className="grid gap-3">
              {filtered.length === 0 ? (
                <div className="rounded-lg border border-border bg-surface-subtle p-6 text-center text-sm text-muted-foreground">
                  No actions match this filter.
                </div>
              ) : (
                filtered.map((item) => {
                  const risk = item.trace?.risk ?? 0;
                  const policies = item.trace?.policies ?? [];
                  const executed = item.trace?.executed ?? false;

                  return (
                    <button
                      key={item.action.id}
                      onClick={() => setSelectedId(item.action.id)}
                      className={cn(
                        "rounded-lg border border-border bg-surface-subtle p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:border-info/30",
                        selected?.action.id === item.action.id && "border-info/40 bg-info-soft",
                      )}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Zap className="h-4 w-4 text-info" aria-hidden="true" />

                            <h3 className="font-semibold text-foreground">{item.action.type}</h3>

                            <StatusPill label={item.status} tone={toneFromDecision(item.status)} />
                          </div>

                          <p className="text-sm leading-6 text-muted-foreground">
                            {item.action.description}
                          </p>
                        </div>

                        <div className="w-full shrink-0 md:w-40">
                          <RiskMeter risk={risk} />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {policies.map((policy) => (
                          <StatusPill key={policy.id} label={policy.id} tone="neutral" />
                        ))}

                        <StatusPill
                          label={executed ? "Executed" : "Held"}
                          tone={executed ? "success" : "warning"}
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Action details"
            description="Current selection and decision rationale."
          >
            {selected ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      {selected.action.title}
                    </p>

                    <h2 className="mt-1 text-xl font-semibold text-foreground">
                      {selected.action.type}
                    </h2>
                  </div>

                  <StatusPill label={selected.status} tone={toneFromDecision(selected.status)} />
                </div>

                <p className="text-sm leading-6 text-muted-foreground">
                  {selected.trace?.reason ?? "No trace details are available for this action."}
                </p>

                <RiskMeter risk={selected.trace?.risk ?? 0} />

                <div className="rounded-lg border border-border bg-surface-subtle p-4">
                  <p className="mb-3 text-xs uppercase text-muted-foreground">Parameters</p>

                  <dl className="space-y-2 text-sm">
                    {Object.entries(selected.action.parameters ?? {}).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0"
                      >
                        <dt className="text-muted-foreground">{key}</dt>

                        <dd className="text-right text-foreground">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="space-y-2">
                  {(selected.trace?.policies ?? []).map((policy) => (
                    <div
                      key={policy.id}
                      className="rounded-md border border-border bg-surface-subtle p-3 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-info">{policy.id}</span>

                        <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      </div>

                      <p className="mt-2 text-muted-foreground">{policy.description}</p>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full"
                  variant={selected.status === "BLOCK" ? "destructive" : "secondary"}
                  disabled={selected.status === "BLOCK"}
                >
                  {selected.status === "BLOCK" ? (
                    <ShieldCheck className="h-4 w-4" />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}

                  {selected.status === "BLOCK" ? "Execution blocked" : "Open execution record"}
                </Button>
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No action selected.
              </div>
            )}
          </SectionCard>
        </div>
      ) : null}
    </div>
  );
}
