import { apiConfig, mockDelay, requestJson } from "./api";
import { overviewMetrics, performanceSummary, systemStatus } from "@/mocks/agentshield";
import type { MetricSummary, PerformanceSummary, SystemStatus } from "@/types/agentshield";

export async function getSystemStatus(): Promise<SystemStatus> {
  if (!apiConfig.useMocks) return requestJson<SystemStatus>("/status");
  await mockDelay(120);
  return systemStatus;
}

export async function getMetrics(): Promise<{
  overview: MetricSummary[];
  performance: PerformanceSummary;
}> {
  if (!apiConfig.useMocks)
    return requestJson<{ overview: MetricSummary[]; performance: PerformanceSummary }>("/metrics");
  await mockDelay(200);
  return { overview: overviewMetrics, performance: performanceSummary };
}
