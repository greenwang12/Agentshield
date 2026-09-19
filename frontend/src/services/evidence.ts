import { apiConfig, mockDelay, requestJson } from "./api";
import { evidence } from "@/mocks/agentshield";
import type { Evidence } from "@/types/agentshield";

export async function getEvidence(): Promise<Evidence[]> {
  if (!apiConfig.useMocks) return requestJson<Evidence[]>("/evidence");
  await mockDelay(180);
  return evidence;
}

export async function searchEvidence(query: string, category = "All"): Promise<Evidence[]> {
  if (!apiConfig.useMocks) {
    const params = new URLSearchParams({ q: query, category });
    return requestJson<Evidence[]>(`/evidence/search?${params.toString()}`);
  }

  await mockDelay(140);
  const normalized = query.trim().toLowerCase();
  return evidence.filter((item) => {
    const matchesQuery =
      normalized.length === 0 ||
      item.content.toLowerCase().includes(normalized) ||
      item.documentId.toLowerCase().includes(normalized) ||
      item.source.toLowerCase().includes(normalized);
    const matchesCategory = category === "All" || item.category === category;
    return matchesQuery && matchesCategory;
  });
}
