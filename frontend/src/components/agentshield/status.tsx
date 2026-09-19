import type { Decision } from "@/types/agentshield";
import { cn } from "@/lib/utils";

const toneClasses = {
  success: "border-success/25 bg-success-soft text-success",
  warning: "border-warning/25 bg-warning-soft text-warning",
  danger: "border-danger/25 bg-danger-soft text-danger",
  neutral: "border-border bg-secondary text-muted-foreground",
  info: "border-info/25 bg-info-soft text-info",
};

export type StatusTone = keyof typeof toneClasses;

export function toneFromDecision(decision: Decision): StatusTone {
  if (decision === "APPROVE") return "success";
  if (decision === "REVIEW") return "warning";
  return "danger";
}

export function StatusPill({
  label,
  tone = "neutral",
  pulse = false,
}: {
  label: string;
  tone?: StatusTone;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full bg-current", pulse && "animate-pulse")}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

export function RiskMeter({ risk }: { risk: number }) {
  const tone = risk >= 75 ? "danger" : risk >= 35 ? "warning" : "success";
  return (
    <div className="space-y-2" aria-label={`Risk ${risk} out of 100`}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Risk</span>
        <span
          className={cn(
            "font-semibold",
            tone === "danger" && "text-danger",
            tone === "warning" && "text-warning",
            tone === "success" && "text-success",
          )}
        >
          {risk}/100
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            tone === "danger" && "bg-danger",
            tone === "warning" && "bg-warning",
            tone === "success" && "bg-success",
          )}
          style={{ width: `${risk}%` }}
        />
      </div>
    </div>
  );
}
