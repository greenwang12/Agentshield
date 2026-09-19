import { useEffect, useMemo, useState } from "react";
import { BookOpenText, Search, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageIntro, SectionCard, ErrorState } from "@/components/agentshield/page-shell";
import { LoadingState } from "@/components/agentshield/loading-state";
import { StatusPill } from "@/components/agentshield/status";
import { getPolicies } from "@/services/policies";
import { traces } from "@/mocks/agentshield";
import type { Policy } from "@/types/agentshield";
import { formatDateTime } from "@/utils/format";
import { cn } from "@/lib/utils";

const categories = [
  "All",
  "Reliability",
  "Relevance",
  "Privacy",
  "Actions",
  "Finance",
  "Communication",
] as const;

export function PoliciesPage() {
  const [items, setItems] = useState<Policy[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getPolicies();
      setItems(data);
      setSelectedId((prev) => prev ?? data[0]?.id ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Policies could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((policy) => {
      const matchesCategory = category === "All" || policy.category === category;
      const matchesQuery =
        policy.id.toLowerCase().includes(q) || policy.description.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [category, items, query]);

  const selected = filtered.find((policy) => policy.id === selectedId) ?? filtered[0];
  const selectedTraces = selected
    ? traces.filter((trace) => trace.policies.some((policy) => policy.id === selected.id))
    : [];

  return (
    <div className="animate-page-in space-y-6">
      <PageIntro
        eyebrow="Policy engine"
        title="Policies"
        description="Manage the rules AgentShield applies to reliability, relevance, privacy, financial actions, and external communication."
      />
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {loading ? <LoadingState message="Loading security policies..." /> : null}
      {!loading && !error ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
          <SectionCard
            title="Policy catalogue"
            description="Filter by category or search policy text."
          >
            <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  aria-label="Search policies"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search policies"
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((item) => (
                  <Button
                    key={item}
                    variant={category === item ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-3">
              {filtered.map((policy) => (
                <button
                  key={policy.id}
                  onClick={() => setSelectedId(policy.id)}
                  className={cn(
                    "rounded-lg border border-border bg-surface-subtle p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:border-info/30",
                    selected?.id === policy.id && "border-info/40 bg-info-soft",
                  )}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <BookOpenText className="h-4 w-4 text-info" aria-hidden="true" />
                    <span className="font-mono text-xs text-info">{policy.id}</span>
                    <StatusPill label={policy.status} tone="success" />
                    <StatusPill label={policy.category} tone="neutral" />
                  </div>
                  <p className="text-sm leading-6 text-foreground">{policy.description}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Triggered {policy.triggeredCount} times
                  </p>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Policy details" description="Recent activity for the selected rule.">
            {selected ? (
              <div className="space-y-5">
                <div>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="font-mono text-sm text-info">{selected.id}</span>
                    <StatusPill
                      label={selected.severity}
                      tone={
                        selected.severity === "Critical"
                          ? "danger"
                          : selected.severity === "High"
                            ? "warning"
                            : "neutral"
                      }
                    />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">{selected.category}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {selected.description}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md bg-surface-subtle p-3">
                    <p className="text-muted-foreground">Triggered</p>
                    <p className="mt-1 text-xl font-semibold text-foreground">
                      {selected.triggeredCount}
                    </p>
                  </div>
                  <div className="rounded-md bg-surface-subtle p-3">
                    <p className="text-muted-foreground">Status</p>
                    <p className="mt-1 text-xl font-semibold text-foreground">{selected.status}</p>
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Recent traces</h3>
                  {selectedTraces.length > 0 ? (
                    <div className="space-y-3">
                      {selectedTraces.map((trace) => (
                        <div
                          key={trace.id}
                          className="rounded-md border border-border bg-surface-subtle p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs text-info">{trace.id}</span>
                            <StatusPill
                              label={trace.decision}
                              tone={
                                trace.decision === "BLOCK"
                                  ? "danger"
                                  : trace.decision === "REVIEW"
                                    ? "warning"
                                    : "success"
                              }
                            />
                          </div>
                          <p className="mt-2 text-sm text-foreground">{trace.user_input}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDateTime(trace.timestamp)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-md border border-border bg-surface-subtle p-4 text-sm text-muted-foreground">
                      <ShieldAlert className="mb-2 h-4 w-4 text-success" aria-hidden="true" />
                      No recent triggers for this policy.
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </SectionCard>
        </div>
      ) : null}
    </div>
  );
}
