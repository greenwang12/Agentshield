import { cn } from "@/lib/utils";

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-secondary", className)} />;
}

export function LoadingState({ message = "Analyzing request..." }: { message?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5" role="status" aria-live="polite">
      <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-2 w-2 animate-pulse rounded-full bg-info" aria-hidden="true" />
        {message}
      </div>
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="h-4 w-1/2" />
        <SkeletonBlock className="h-20 w-full" />
      </div>
    </div>
  );
}
