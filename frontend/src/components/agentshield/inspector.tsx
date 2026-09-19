import {
  CheckCircle2,
  Clock3,
  FileText,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { AgentResponse, GuardrailResult } from "@/types/agentshield";
import { RiskMeter, StatusPill, toneFromDecision } from "@/components/agentshield/status";
import { LoadingState } from "@/components/agentshield/loading-state";
import { EmptyState } from "@/components/agentshield/empty-state";
import { cn } from "@/lib/utils";

function DecisionIcon({ decision }: { decision: GuardrailResult["decision"] }) {
  if (decision === "APPROVE")
    return <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />;
  if (decision === "REVIEW")
    return <ShieldAlert className="h-5 w-5 text-warning" aria-hidden="true" />;
  return <XCircle className="h-5 w-5 text-danger" aria-hidden="true" />;
}

export function InspectorPanel({
  response,
  loading,
}: {
  response: AgentResponse | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <aside className="space-y-4" aria-label="AgentShield inspector">
        <LoadingState message="Retrieving verified context..." />
        <LoadingState message="Checking security policies..." />
      </aside>
    );
  }

  if (!response) {
    return (
      <aside aria-label="AgentShield inspector">
        <EmptyState
          icon={ShieldCheck}
          title="Inspector waiting for a request"
          description="Send a message to see intent detection, Moss retrieval, policy checks, risk, decision, and latency in one place."
        />
      </aside>
    );
  }

  const { guardrail } = response;

  return (
    <aside className="space-y-4" aria-label="AgentShield inspector">
      <section className="rounded-lg border border-border bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Decision</p>
            <div className="mt-2 flex items-center gap-2">
              <DecisionIcon decision={guardrail.decision} />
              <h2 className="text-xl font-semibold text-foreground">{guardrail.decision}</h2>
            </div>
          </div>
          <StatusPill label={guardrail.verdict} tone={toneFromDecision(guardrail.decision)} />
        </div>
        <RiskMeter risk={guardrail.risk} />
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{guardrail.reason}</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-info" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">Request</h2>
        </div>
        <div className="space-y-4 text-sm">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">User input</p>
            <p className="rounded-md border border-border bg-surface-subtle p-3 text-foreground">
              {response.userInput}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Intent</p>
            <p className="font-medium text-foreground">{response.intent}</p>
          </div>
          {response.action ? (
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Action proposal</p>
              <div className="rounded-md border border-border bg-surface-subtle p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">{response.action.type}</span>
                  {response.action.irreversible ? (
                    <StatusPill label="Irreversible" tone="danger" />
                  ) : (
                    <StatusPill label="Reversible" tone="success" />
                  )}
                </div>
                <p className="text-muted-foreground">{response.action.description}</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Agent response</p>
              <p className="rounded-md border border-border bg-surface-subtle p-3 text-foreground">
                {response.agentOutput}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <LockKeyhole className="h-4 w-4 text-info" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">Policies Checked</h2>
        </div>
        <div className="space-y-3">
          {guardrail.policies.map((policy) => (
            <div
              key={policy.id}
              className={cn(
                "rounded-md border border-border bg-surface-subtle p-3",
                guardrail.violations.includes(policy.id) && "border-warning/30 bg-warning-soft",
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-info">{policy.id}</span>
                <StatusPill
                  label={policy.severity}
                  tone={
                    policy.severity === "Critical"
                      ? "danger"
                      : policy.severity === "High"
                        ? "warning"
                        : "neutral"
                  }
                />
              </div>
              <p className="text-sm leading-5 text-muted-foreground">{policy.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 shadow-soft">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Verified Evidence</h2>
        <div className="space-y-3">
          {guardrail.evidence.map((item) => (
            <div key={item.id} className="rounded-md border border-border bg-surface-subtle p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-info">{item.documentId}</span>
                <span className="text-xs text-muted-foreground">{item.retrievalTimeMs} ms</span>
              </div>
              <p className="text-sm leading-5 text-muted-foreground">{item.content}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-info" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">Latency</h2>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md bg-surface-subtle p-3">
            <dt className="text-muted-foreground">Moss</dt>
            <dd className="mt-1 font-semibold text-foreground">
              {guardrail.latency.parallel_retrieval_ms} ms
            </dd>
          </div>
          <div className="rounded-md bg-surface-subtle p-3">
            <dt className="text-muted-foreground">Evaluation</dt>
            <dd className="mt-1 font-semibold text-foreground">
              {guardrail.latency.evaluation_ms} ms
            </dd>
          </div>
          <div className="col-span-2 rounded-md bg-surface-subtle p-3">
            <dt className="text-muted-foreground">Total</dt>
            <dd className="mt-1 font-semibold text-foreground">
              {guardrail.latency.total_guardrail_ms} ms
            </dd>
          </div>
        </dl>
      </section>
    </aside>
  );
}
