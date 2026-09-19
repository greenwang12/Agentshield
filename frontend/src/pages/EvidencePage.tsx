import { useEffect, useMemo, useState } from "react";
import { Database, FileSearch, Search, Timer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageIntro, SectionCard, ErrorState } from "@/components/agentshield/page-shell";
import { LoadingState } from "@/components/agentshield/loading-state";
import { EmptyState } from "@/components/agentshield/empty-state";
import { StatusPill } from "@/components/agentshield/status";
import { searchEvidence } from "@/services/evidence";
import { apiConfig, requestJson } from "@/services/api";
import { traces } from "@/mocks/agentshield";
import type { Evidence } from "@/types/agentshield";
import { formatDateTime } from "@/utils/format";
import { cn } from "@/lib/utils";

const categories = [
  "All",
  "Account",
  "Privacy",
  "Billing",
  "Product",
  "Security",
  "Communication",
] as const;

type MetricsResponse = {
  performance?: {
    mossResponseRetrieval?: {
      mean?: number;
      average?: number;
      avg?: number;
    };
  };
  overview?: Array<{
    label?: string;
    value?: string;
  }>;
};

export function EvidencePage() {
  const [items, setItems] = useState<Evidence[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [averageRetrieval, setAverageRetrieval] = useState("0.00");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(nextQuery = query, nextCategory = category) {
    setLoading(true);
    setError(null);

    try {
      const [data, metrics] = await Promise.all([
        searchEvidence(nextQuery, nextCategory),
        apiConfig.useMocks ? Promise.resolve(null) : requestJson<MetricsResponse>("/metrics"),
      ]);

      setItems(data);

      setSelectedId((prev) =>
        prev && data.some((item) => item.id === prev) ? prev : (data[0]?.id ?? null),
      );

      if (metrics) {
        const retrieval = metrics.performance?.mossResponseRetrieval;

        const value = retrieval?.mean ?? retrieval?.average ?? retrieval?.avg;

        if (typeof value === "number") {
          setAverageRetrieval(value.toFixed(2));
        } else {
          const overviewValue = metrics.overview?.find(
            (item) => item.label === "Average Moss Retrieval",
          )?.value;

          if (overviewValue) {
            setAverageRetrieval(overviewValue.replace(" ms", ""));
          }
        }
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Evidence could not be retrieved from Moss.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(query, category), 200);

    return () => window.clearTimeout(timer);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category]);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? items[0],
    [items, selectedId],
  );

  const usedIn = selected
    ? traces.filter((trace) => trace.evidence.some((doc) => doc.documentId === selected.documentId))
    : [];

  return (
    <div className="animate-page-in space-y-6">
      <PageIntro
        eyebrow="Moss retrieval"
        title="Evidence"
        description="Search the trusted knowledge Moss retrieves at runtime. Every AgentShield verdict is grounded in these verified documents."
      >
        <div className="hidden items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground md:flex">
          <Timer className="h-3.5 w-3.5 text-info" aria-hidden="true" />
          {averageRetrieval} ms avg retrieval
        </div>
      </PageIntro>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />

          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
            placeholder="Search evidence content, document id, or source"
            aria-label="Search evidence"
          />
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter evidence by category">
          {categories.map((item) => (
            <Button
              key={item}
              size="sm"
              variant={category === item ? "secondary" : "outline"}
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>

      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}

      {loading ? <LoadingState message="Retrieving verified context from Moss..." /> : null}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="No evidence matched"
          description="Try a shorter search term or switch the category filter to All to see every document Moss can retrieve."
          actionLabel="Reset filters"
          onAction={() => {
            setQuery("");
            setCategory("All");
          }}
        />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
          <SectionCard
            title="Retrieved documents"
            description={`${items.length} document${
              items.length === 1 ? "" : "s"
            } available to the guardrail.`}
          >
            <ul className="space-y-2">
              {items.map((item) => {
                const isActive = selected?.id === item.id;

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      aria-current={isActive}
                      className={cn(
                        "w-full rounded-lg border border-border bg-surface-subtle p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive
                          ? "border-info/40 bg-info-soft"
                          : "hover:border-border hover:bg-secondary",
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-sm font-medium text-foreground">
                          {item.documentId}
                        </span>

                        <div className="flex items-center gap-2">
                          <StatusPill label={item.category} tone="neutral" />

                          <StatusPill label="Verified evidence" tone="info" />
                        </div>
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {item.content}
                      </p>

                      <p className="mt-2 text-xs text-muted-foreground">
                        {item.source} ·{" "}
                        {item.retrievalTimeMs > 0
                          ? "retrieved in " + item.retrievalTimeMs + " ms"
                          : "indexed source"}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </SectionCard>

          {selected ? (
            <div className="space-y-6">
              <SectionCard title="Document" description={selected.documentId}>
                <div className="space-y-4">
                  <p className="rounded-lg border border-border bg-surface-subtle p-4 text-sm leading-6 text-foreground">
                    {selected.content}
                  </p>

                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs uppercase text-muted-foreground">Category</dt>

                      <dd className="mt-1 text-foreground">{selected.category}</dd>
                    </div>

                    <div>
                      <dt className="text-xs uppercase text-muted-foreground">Source</dt>

                      <dd className="mt-1 text-foreground">{selected.source}</dd>
                    </div>

                    <div>
                      <dt className="text-xs uppercase text-muted-foreground">Relevance</dt>

                      <dd className="mt-1 text-foreground">Verified</dd>
                    </div>

                    <div>
                      <dt className="text-xs uppercase text-muted-foreground">Last verified</dt>

                      <dd className="mt-1 text-foreground">
                        {formatDateTime(selected.lastVerified)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </SectionCard>

              <SectionCard
                title="Retrieval details"
                description="Measured locally during the last guardrail run."
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-md border border-border bg-surface-subtle px-4 py-3 text-sm">
                    <span className="text-muted-foreground">Moss retrieval time</span>

                    <span className="font-mono text-foreground">
                      {selected.retrievalTimeMs > 0 ? selected.retrievalTimeMs + " ms" : "Indexed"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-md border border-border bg-surface-subtle px-4 py-3 text-sm">
                    <span className="text-muted-foreground">Used in traces</span>

                    <span className="font-mono text-foreground">{usedIn.length}</span>
                  </div>

                  {usedIn.length > 0 ? (
                    <ul className="space-y-2">
                      {usedIn.map((trace) => (
                        <li
                          key={trace.id}
                          className="rounded-md border border-border bg-card px-4 py-3 text-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs text-muted-foreground">
                              {trace.id}
                            </span>

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
                          </div>

                          <p className="mt-2 text-foreground">{trace.user_input}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Database className="h-4 w-4" aria-hidden="true" />
                      This document has not been retrieved in the traces loaded so far.
                    </p>
                  )}
                </div>
              </SectionCard>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
