import { apiConfig, mockDelay, requestJson } from "./api";
import { evidence, policies, traces } from "@/mocks/agentshield";
import type { AgentResponse } from "@/types/agentshield";

export async function sendMessage(message: string): Promise<AgentResponse> {
  if (!apiConfig.useMocks) {
    return requestJson<AgentResponse>("/agent/messages", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }

  await mockDelay(850);
  const text = message.toLowerCase();
  const trace =
    text.includes("delete") || text.includes("remove my account")
      ? traces.find((item) => item.id === "trace_1008")
      : text.includes("private") || text.includes("phone") || text.includes("billing")
        ? traces.find((item) => item.id === "trace_1007")
        : text.includes("refund")
          ? traces.find((item) => item.id === "trace_1004")
          : text.includes("email") || text.includes("send")
            ? traces.find((item) => item.id === "trace_1005")
            : text.includes("digest") || text.includes("setting")
              ? traces.find((item) => item.id === "trace_1003")
              : traces.find((item) => item.id === "trace_1006");

  if (!trace) throw new Error("AgentShield mock trace is unavailable.");

  return {
    id: `response_${Date.now()}`,
    userInput: message,
    agentOutput: trace.agent_output,
    intent: trace.intent,
    traceType: trace.trace_type,
    ...(trace.action ? { action: trace.action } : {}),
    timestamp: new Date().toISOString(),
    guardrail: {
      verdict: trace.verdict,
      risk: trace.risk,
      violations: trace.violations,
      decision: trace.decision,
      reason: trace.reason,
      evidence: trace.evidence.length > 0 ? trace.evidence : evidence.slice(0, 1),
      policies: trace.policies.length > 0 ? trace.policies : policies.slice(0, 2),
      executed: trace.executed,
      latency: trace.latency,
    },
  };
}
