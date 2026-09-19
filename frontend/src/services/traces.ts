import { apiConfig, mockDelay, requestJson } from "./api";
import { traces } from "@/mocks/agentshield";
import type { Trace } from "@/types/agentshield";

export async function getTraces(): Promise<Trace[]> {
  if (!apiConfig.useMocks) return requestJson<Trace[]>("/traces");
  await mockDelay(220);
  return traces;
}

export async function getAgentTrace(id: string): Promise<Trace> {
  if (!apiConfig.useMocks) return requestJson<Trace>(`/traces/${id}`);
  await mockDelay(180);
  const trace = traces.find((item) => item.id === id) ?? traces[0];
  if (!trace) throw new Error("Trace not found.");
  return trace;
}
