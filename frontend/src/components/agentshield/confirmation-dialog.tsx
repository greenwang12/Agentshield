import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AgentResponse } from "@/types/agentshield";
import { confirmAction } from "@/services/actions";
import { RiskMeter, StatusPill } from "@/components/agentshield/status";

const executionSteps = ["Checking authorization...", "Policy confirmed...", "Executing action..."];

export function ConfirmationDialog({
  response,
  open,
  onOpenChange,
  onComplete,
}: {
  response: AgentResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}) {
  const [stage, setStage] = useState<"idle" | "running" | "complete">("idle");
  const [activeStep, setActiveStep] = useState(0);
  const action = response?.action;

  useEffect(() => {
    if (!open) {
      setStage("idle");
      setActiveStep(0);
    }
  }, [open]);

  async function handleConfirm() {
    if (!action) return;
    setStage("running");
    for (let index = 0; index < executionSteps.length; index += 1) {
      setActiveStep(index);
      await new Promise((resolve) => window.setTimeout(resolve, 420));
    }
    await confirmAction(action.id);
    setStage("complete");
    onComplete();
  }

  if (!response || !action) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-border bg-card p-0 text-foreground sm:max-w-2xl">
        <DialogHeader className="border-b border-border px-6 py-5">
          <div className="mb-2 flex items-center gap-2">
            <StatusPill label="REVIEW" tone="warning" />
            <StatusPill label={action.type} tone="neutral" />
          </div>
          <DialogTitle>Confirm action execution</DialogTitle>
          <DialogDescription>{response.guardrail.reason}</DialogDescription>
        </DialogHeader>

        {stage === "complete" ? (
          <div className="px-6 py-8 text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-success-soft text-success">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Action Approved</h3>
            <p className="mt-2 text-sm text-muted-foreground">Execution Complete</p>
          </div>
        ) : (
          <div className="space-y-5 px-6 py-5">
            <div className="rounded-lg border border-border bg-surface-subtle p-4">
              <p className="text-xs uppercase text-muted-foreground">Action</p>
              <h3 className="mt-1 text-base font-semibold text-foreground">{action.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{action.description}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <div className="rounded-lg border border-border bg-surface-subtle p-4">
                <p className="mb-3 text-xs uppercase text-muted-foreground">Parameters</p>
                <dl className="space-y-2 text-sm">
                  {Object.entries(action.parameters).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-start justify-between gap-4 border-b border-border/60 pb-2 last:border-0 last:pb-0"
                    >
                      <dt className="text-muted-foreground">{key}</dt>
                      <dd className="text-right font-medium text-foreground">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="rounded-lg border border-border bg-surface-subtle p-4">
                <RiskMeter risk={response.guardrail.risk} />
                <div className="mt-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">What happens next</p>
                  <p className="mt-1 leading-5">
                    AgentShield re-checks authorization, records the confirmed policy state, and
                    then executes the tool.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-warning/25 bg-warning-soft p-4">
              <p className="text-sm font-medium text-warning">Why confirmation is required</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {response.guardrail.policies[0]?.description}
              </p>
            </div>
            {stage === "running" ? (
              <div
                className="rounded-lg border border-border bg-surface-subtle p-4"
                role="status"
                aria-live="polite"
              >
                {executionSteps.map((step, index) => (
                  <div
                    key={step}
                    className="flex items-center gap-3 py-2 text-sm text-muted-foreground"
                  >
                    {index <= activeStep ? (
                      <Loader2 className="h-4 w-4 animate-spin text-info" aria-hidden="true" />
                    ) : (
                      <span
                        className="h-4 w-4 rounded-full border border-border"
                        aria-hidden="true"
                      />
                    )}
                    <span className={index <= activeStep ? "text-foreground" : undefined}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter className="border-t border-border px-6 py-4">
          {stage === "complete" ? (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={stage === "running"}
              >
                <XCircle className="h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={stage === "running"}>
                {stage === "running" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Confirm & Execute
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
