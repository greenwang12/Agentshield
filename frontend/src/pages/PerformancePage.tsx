import { useEffect, useState } from "react";
import { Activity, BarChart3, Info } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageIntro, SectionCard, ErrorState } from "@/components/agentshield/page-shell";
import { LoadingState } from "@/components/agentshield/loading-state";
import { StatusPill } from "@/components/agentshield/status";
import { getMetrics } from "@/services/metrics";
import type { PerformanceSummary } from "@/types/agentshield";

const axisStyle = { fill: "hsl(var(--muted-foreground))", fontSize: 12 } as const;

function chartTooltip() {
  return (
    <Tooltip
      contentStyle={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: 8,
        fontSize: 12,
        color: "hsl(var(--foreground))",
      }}
    />
  );
}

const rows: Array<{ key: keyof Omit<PerformanceSummary, "points">; label: string }> = [
  { key: "responseGuardrail", label: "Response guardrail" },
  { key: "mossResponseRetrieval", label: "Moss response retrieval" },
  { key: "geminiResponseEvaluation", label: "Gemini response evaluation" },
  { key: "actionGuardrail", label: "Action guardrail" },
  { key: "mossActionPolicyRetrieval", label: "Moss action policy retrieval" },
  { key: "geminiActionEvaluation", label: "Gemini action evaluation" },
];

export function PerformancePage() {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getMetrics();
      setSummary(data.performance);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Performance metrics are unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) return <LoadingState message="Collecting latency measurements..." />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!summary) return null;

  const waterfall = [
    { stage: "Agent", ms: 410 },
    { stage: "Moss evidence", ms: Math.round(summary.mossResponseRetrieval.mean) },
    { stage: "Moss policy", ms: Math.round(summary.mossActionPolicyRetrieval.mean) },
    { stage: "Gemini evaluation", ms: Math.round(summary.geminiResponseEvaluation.mean) },
    { stage: "Total guardrail", ms: Math.round(summary.responseGuardrail.mean) },
  ];

  return (
    <div className="animate-page-in space-y-6">
      <PageIntro
        eyebrow="Observability"
        title="Performance"
        description="End-to-end guardrail latency, split by retrieval and evaluation. Moss retrieval is fast; model evaluation dominates total time."
      >
        <StatusPill label="LOCAL MEASUREMENTS" tone="info" />
      </PageIntro>

      <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-subtle p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 text-info" aria-hidden="true" />
        <p>
          These are local development measurements. Moss retrieval runs in ~22–27 ms, but the full
          guardrail pipeline averages ~950 ms because model evaluation is the dominant cost. The
          pipeline is not sub-10 ms end to end.
        </p>
      </div>

      <SectionCard
        title="Latency table"
        description="Average, median, P95 and current, in milliseconds."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Guardrail latency statistics in milliseconds</caption>
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground">
                <th scope="col" className="pb-3 pr-4 font-medium">
                  Stage
                </th>
                <th scope="col" className="pb-3 pr-4 font-medium">
                  Mean
                </th>
                <th scope="col" className="pb-3 pr-4 font-medium">
                  Median
                </th>
                <th scope="col" className="pb-3 pr-4 font-medium">
                  P95
                </th>
                <th scope="col" className="pb-3 font-medium">
                  Current
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const stat = summary[row.key];
                return (
                  <tr key={row.key} className="border-t border-border">
                    <th scope="row" className="py-3 pr-4 text-left font-medium text-foreground">
                      {row.label}
                    </th>
                    <td className="py-3 pr-4 text-muted-foreground">{stat.mean.toFixed(2)}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{stat.median.toFixed(2)}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{stat.p95.toFixed(2)}</td>
                    <td className="py-3 font-medium text-foreground">{stat.current.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Latency over time" description="Total guardrail latency per hour.">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.points}>
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="time" tick={axisStyle} stroke="hsl(var(--border))" />
                <YAxis tick={axisStyle} stroke="hsl(var(--border))" unit="ms" width={60} />
                {chartTooltip()}
                <Area
                  type="monotone"
                  dataKey="responseGuardrail"
                  name="Response guardrail"
                  stroke="hsl(var(--info))"
                  fill="hsl(var(--info))"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Retrieval vs evaluation"
          description="Moss retrieval compared with model evaluation."
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.points}>
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="time" tick={axisStyle} stroke="hsl(var(--border))" />
                <YAxis tick={axisStyle} stroke="hsl(var(--border))" unit="ms" width={60} />
                {chartTooltip()}
                <Line
                  type="monotone"
                  dataKey="retrieval"
                  name="Moss retrieval"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="evaluation"
                  name="Evaluation"
                  stroke="hsl(var(--warning))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Response vs action" description="Guardrail latency by trace type.">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.points}>
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="time" tick={axisStyle} stroke="hsl(var(--border))" />
                <YAxis tick={axisStyle} stroke="hsl(var(--border))" unit="ms" width={60} />
                {chartTooltip()}
                <Line
                  type="monotone"
                  dataKey="responseGuardrail"
                  name="Response"
                  stroke="hsl(var(--info))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="actionGuardrail"
                  name="Action"
                  stroke="hsl(var(--danger))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Latency waterfall"
          description="Mean contribution of each pipeline stage."
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfall} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={axisStyle} stroke="hsl(var(--border))" unit="ms" />
                <YAxis
                  type="category"
                  dataKey="stage"
                  tick={axisStyle}
                  stroke="hsl(var(--border))"
                  width={130}
                />
                {chartTooltip()}
                <Bar
                  dataKey="ms"
                  name="Mean latency"
                  fill="hsl(var(--info))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Current total guardrail",
            value: `${summary.responseGuardrail.current} ms`,
            icon: Activity,
          },
          {
            label: "P95 total guardrail",
            value: `${summary.responseGuardrail.p95} ms`,
            icon: BarChart3,
          },
          {
            label: "Moss evidence mean",
            value: `${summary.mossResponseRetrieval.mean.toFixed(2)} ms`,
            icon: Activity,
          },
          {
            label: "Moss policy mean",
            value: `${summary.mossActionPolicyRetrieval.mean.toFixed(2)} ms`,
            icon: Activity,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-lg border border-border bg-card p-4 shadow-soft"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase text-muted-foreground">{card.label}</p>
                <Icon className="h-4 w-4 text-info" aria-hidden="true" />
              </div>
              <p className="mt-2 text-xl font-semibold text-foreground">{card.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
