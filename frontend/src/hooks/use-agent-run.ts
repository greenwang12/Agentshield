import { useMemo, useState } from "react";
import type { AgentMessage, AgentResponse } from "@/types/agentshield";
import { sendMessage } from "@/services/agent";

type RunStatus = "idle" | "analyzing" | "ready" | "error";

const starterMessages: AgentMessage[] = [
  {
    id: "msg_welcome",
    role: "system",
    content:
      "AgentShield is ready. Try a normal question, a destructive action, a refund, or a privacy-sensitive request.",
    timestamp: "2026-09-18T14:00:00.000Z",
    status: "approved",
  },
];

export function useAgentRun() {
  const [messages, setMessages] = useState<AgentMessage[]>(starterMessages);
  const [currentResponse, setCurrentResponse] = useState<AgentResponse | null>(null);
  const [status, setStatus] = useState<RunStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const suggestedPrompts = useMemo(
    () => [
      "How long does a password reset link last?",
      "Delete my account.",
      "Give me Priya's private billing phone number.",
      "Issue a $420 refund if needed.",
    ],
    [],
  );

  async function submitMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed) return;

    setError(null);
    setStatus("analyzing");
    const userMessage: AgentMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
      status: "analyzing",
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await sendMessage(trimmed);
      setCurrentResponse(response);
      setMessages((prev) => [
        ...prev,
        {
          id: response.id,
          role: "agent",
          content: response.action ? response.action.type : response.agentOutput,
          timestamp: response.timestamp,
          traceId: response.id,
          status:
            response.guardrail.decision === "APPROVE"
              ? "approved"
              : response.guardrail.decision === "REVIEW"
                ? "review"
                : "blocked",
        },
      ]);
      setStatus("ready");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "AgentShield could not analyze this request.",
      );
      setStatus("error");
    }
  }

  function markActionExecuted() {
    setCurrentResponse((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        guardrail: {
          ...prev.guardrail,
          decision: "APPROVE",
          executed: true,
          reason:
            "Explicit confirmation was captured, the policy requirement was satisfied, and the action completed.",
        },
      };
    });
    setMessages((prev) => [
      ...prev,
      {
        id: `execution_${Date.now()}`,
        role: "system",
        content: "Action Approved · Execution Complete",
        timestamp: new Date().toISOString(),
        status: "executed",
      },
    ]);
  }

  return {
    messages,
    currentResponse,
    status,
    error,
    suggestedPrompts,
    submitMessage,
    markActionExecuted,
  };
}
