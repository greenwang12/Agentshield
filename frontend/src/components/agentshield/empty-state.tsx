import type { LucideIcon } from "lucide-react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon = ShieldCheck,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-subtle px-6 py-10 text-center">
      <div className="mb-4 rounded-lg border border-border bg-secondary p-3 text-info">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {actionLabel && onAction ? (
        <Button className="mt-5" variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
