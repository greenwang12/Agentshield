import { FormEvent, useState } from "react";
import {
  AlertOctagon,
  Bot,
  CheckCircle2,
  Command,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PageIntro } from "@/components/agentshield/page-shell";
import { ConfirmationDialog } from "@/components/agentshield/confirmation-dialog";
import { InspectorPanel } from "@/components/agentshield/inspector";
import { StatusPill, toneFromDecision } from "@/components/agentshield/status";
import { useAgentRun } from "@/hooks/use-agent-run";
import { formatTime } from "@/utils/format";
import { cn } from "@/lib/utils";

function StatusTransition({ loading }: { loading: boolean }) {
  const steps = loading
    ? ["Analyzing request...", "Retrieving verified context...", "Checking security policies..."]
    : ["Request analyzed", "Moss context retrieved", "Decision ready"];

  return (
    <div className="grid gap-2 md:grid-cols-3" aria-live="polite">
      {steps.map((step, index) => (
        <div
          key={step}
          className="flex items-center gap-2 rounded-md border border-border bg-surface-subtle px-3 py-2 text-xs text-muted-foreground"
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              loading && index === 0 ? "animate-pulse bg-info" : "bg-success",
            )}
            aria-hidden="true"
          />
          {step}
        </div>
      ))}
    </div>
  );
}

export function LiveAgentPage() {
  const [input, setInput] = useState("Delete my account.");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const {
    messages,
    currentResponse,
    status,
    error,
    suggestedPrompts,
    submitMessage,
    markActionExecuted,
  } = useAgentRun();
  const loading = status === "analyzing";
  const isReviewAction = currentResponse?.guardrail.decision === "REVIEW" && currentResponse.action;
  const isBlocked = currentResponse?.guardrail.decision === "BLOCK";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = input;
    setInput("");
    await submitMessage(value);
  }

  return (
    <div className="animate-page-in space-y-6">
      <PageIntro
        eyebrow="Protected workspace"
        title="Live Agent"
        description="Run agent responses and action proposals through AgentShield before they reach a user or tool."
      >
        <Sheet open={inspectorOpen} onOpenChange={setInspectorOpen}>
          <SheetTrigger asChild>
            <Button variant="secondary" className="xl:hidden">
              <ShieldCheck className="h-4 w-4" />
              Inspector
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-[88vh] overflow-y-auto border-border bg-background xl:hidden"
          >
            <SheetTitle className="mb-4 text-left">AgentShield Inspector</SheetTitle>
            <InspectorPanel response={currentResponse} loading={loading} />
          </SheetContent>
        </Sheet>
      </PageIntro>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="flex min-h-[720px] flex-col rounded-lg border border-border bg-card shadow-panel">
          <div className="border-b border-border p-4">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <h2 className="font-semibold text-foreground">Conversation</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Agent output is held until AgentShield returns a decision.
                </p>
              </div>
              {currentResponse ? (
                <StatusPill
                  label={currentResponse.guardrail.decision}
                  tone={toneFromDecision(currentResponse.guardrail.decision)}
                />
              ) : (
                <StatusPill label="Ready" tone="info" />
              )}
            </div>
            <div className="mt-4">
              <StatusTransition loading={loading} />
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((message) => (
              <article
                key={message.id}
                className={cn("flex gap-3", message.role === "user" && "justify-end")}
              >
                {message.role !== "user" ? (
                  <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-surface-subtle text-info">
                    {message.role === "agent" ? (
                      <Bot className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    )}
                  </div>
                ) : null}
                <div
                  className={cn(
                    "max-w-[760px] rounded-lg border border-border bg-surface-subtle p-4 shadow-soft",
                    message.role === "user" && "bg-secondary",
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium uppercase text-muted-foreground">
                      {message.role === "user"
                        ? "User"
                        : message.role === "agent"
                          ? "AI Agent"
                          : "AgentShield"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                    {message.content}
                  </p>
                  {message.status ? (
                    <div className="mt-3">
                      <StatusPill
                        label={message.status}
                        tone={
                          message.status === "blocked"
                            ? "danger"
                            : message.status === "review"
                              ? "warning"
                              : message.status === "analyzing"
                                ? "info"
                                : "success"
                        }
                      />
                    </div>
                  ) : null}
                </div>
                {message.role === "user" ? (
                  <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-secondary text-muted-foreground">
                    <User className="h-4 w-4" aria-hidden="true" />
                  </div>
                ) : null}
              </article>
            ))}

            {loading ? (
              <div
                className="rounded-lg border border-info/25 bg-info-soft p-4 text-sm text-info"
                role="status"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 animate-pulse" aria-hidden="true" />
                  AgentShield is evaluating the response...
                </div>
              </div>
            ) : null}

            {currentResponse?.action ? (
              <div className="rounded-lg border border-border bg-card p-4 shadow-soft">
                <div className="mb-3 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Action proposal</p>
                    <h3 className="mt-1 font-semibold text-foreground">
                      {currentResponse.action.type}
                    </h3>
                  </div>
                  <StatusPill
                    label={currentResponse.guardrail.decision}
                    tone={toneFromDecision(currentResponse.guardrail.decision)}
                  />
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {currentResponse.action.description}
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {Object.entries(currentResponse.action.parameters).map(([key, value]) => (
                    <div key={key} className="rounded-md bg-surface-subtle p-3 text-sm">
                      <p className="text-xs text-muted-foreground">{key}</p>
                      <p className="mt-1 font-medium text-foreground">{String(value)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-md border border-border bg-surface-subtle p-3 text-sm text-muted-foreground">
                  {isBlocked ? (
                    <div className="flex items-start gap-2">
                      <AlertOctagon className="mt-0.5 h-4 w-4 text-danger" aria-hidden="true" />
                      Execution is disabled because AgentShield blocked this request.
                    </div>
                  ) : isReviewAction ? (
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="mt-0.5 h-4 w-4 text-warning" aria-hidden="true" />
                      Confirmation is required before execution.
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" aria-hidden="true" />
                      AgentShield approved this tool execution.
                    </div>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {isReviewAction ? (
                    <Button onClick={() => setConfirmOpen(true)}>Confirm & Execute</Button>
                  ) : null}
                  {isReviewAction ? <Button variant="outline">Cancel</Button> : null}
                  {isBlocked ? (
                    <Button variant="destructive" disabled>
                      Execution blocked
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {error ? (
              <div
                className="rounded-lg border border-danger/25 bg-danger-soft p-4 text-sm text-danger"
                role="alert"
              >
                {error}
              </div>
            ) : null}
          </div>

          <div className="border-t border-border p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt) => (
                <Button key={prompt} variant="outline" size="sm" onClick={() => setInput(prompt)}>
                  {prompt}
                </Button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
              <label className="sr-only" htmlFor="agent-message">
                Message the protected agent
              </label>
              <Textarea
                id="agent-message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask the agent to answer, send email, issue refund, or delete an account..."
                className="min-h-20 flex-1 resize-none bg-surface-subtle"
              />
              <Button
                type="submit"
                disabled={loading || input.trim().length === 0}
                className="md:self-end"
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
            </form>
            <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Command className="h-3.5 w-3.5" aria-hidden="true" />
              Connected to live AgentShield backend.
            </p>
          </div>
        </section>

        <div className="hidden xl:block">
          <InspectorPanel response={currentResponse} loading={loading} />
        </div>
      </div>

      <ConfirmationDialog
        response={currentResponse}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onComplete={markActionExecuted}
      />
    </div>
  );
}
