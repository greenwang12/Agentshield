import { apiConfig, mockDelay, requestJson } from "./api";
import { actionProposals, traces } from "@/mocks/agentshield";
import type { ActionProposal, Decision, Trace } from "@/types/agentshield";

export type ActionRow = {
  action: ActionProposal;
  trace: Trace | null;
  status: Decision;
};

export async function getActions(): Promise<ActionRow[]> {
  if (!apiConfig.useMocks) {
    const data = await requestJson<unknown>("/actions");

    if (Array.isArray(data)) {
      return data as ActionRow[];
    }

    if (
      typeof data === "object" &&
      data !== null &&
      "actions" in data &&
      Array.isArray((data as { actions: unknown }).actions)
    ) {
      return (data as { actions: ActionRow[] }).actions;
    }

    return [];
  }

  await mockDelay(200);

  return actionProposals.map((action) => {
    const trace = traces.find((item) => item.action?.type === action.type) ?? traces[0];

    if (!trace) {
      throw new Error("Trace data is unavailable.");
    }

    return {
      action,
      trace,
      status: trace.decision,
    };
  });
}

export async function confirmAction(actionId: string): Promise<unknown> {
  return requestJson(`/actions/${actionId}/confirm`, {
    method: "POST",
  });
}
