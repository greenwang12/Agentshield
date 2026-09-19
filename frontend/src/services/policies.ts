import { mockDelay, requestJson, apiConfig } from "./api";
import { policies, traces } from "@/mocks/agentshield";
import type { Policy, Trace } from "@/types/agentshield";

export async function getPolicies(): Promise<Policy[]> {
  if (!apiConfig.useMocks) return requestJson<Policy[]>("/policies");
  await mockDelay(180);
  return policies;
}

export async function getPolicy(id: string): Promise<{ policy: Policy; traces: Trace[] }> {
  if (!apiConfig.useMocks)
    return requestJson<{ policy: Policy; traces: Trace[] }>(`/policies/${id}`);
  await mockDelay(180);
  const policy = policies.find((item) => item.id === id) ?? policies[0];
  if (!policy) throw new Error("Policy not found.");
  return {
    policy,
    traces: traces.filter((trace) => trace.policies.some((item) => item.id === policy.id)),
  };
}
