import type { Decision, Verdict } from "@/types/agentshield";

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function decisionTone(decision: Decision) {
  if (decision === "APPROVE") return "success";
  if (decision === "REVIEW") return "warning";
  return "danger";
}

export function verdictLabel(verdict: Verdict) {
  return verdict === "PASS" ? "PASS" : verdict === "FLAG" ? "FLAG" : "BLOCK";
}

export function clampRisk(risk: number) {
  return Math.max(0, Math.min(100, risk));
}
