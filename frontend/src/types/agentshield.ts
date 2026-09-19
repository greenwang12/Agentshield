export type Verdict = "PASS" | "FLAG" | "BLOCK";
export type Decision = "APPROVE" | "REVIEW" | "BLOCK";
export type ActionType =
  | "SEND_EMAIL"
  | "SHARE_PRIVATE_DATA"
  | "BOOK_SERVICE"
  | "ISSUE_REFUND"
  | "CHANGE_ACCOUNT_SETTINGS"
  | "DELETE_ACCOUNT";

export interface AgentMessage {
  id: string;
  role: "user" | "agent" | "system";
  content: string;
  timestamp: string;
  traceId?: string;
  status?: "queued" | "analyzing" | "approved" | "review" | "blocked" | "executed";
}

export interface ActionProposal {
  id: string;
  type: ActionType;
  title: string;
  description: string;
  parameters: Record<string, string | number | boolean>;
  irreversible: boolean;
  externalCommunication: boolean;
  financial: boolean;
}

export interface Evidence {
  id: string;
  documentId: string;
  category: "Account" | "Privacy" | "Billing" | "Product" | "Security" | "Communication";
  content: string;
  relevance: number;
  retrievalTimeMs: number;
  source: string;
  lastVerified: string;
}

export interface Policy {
  id: string;
  category: "Reliability" | "Relevance" | "Privacy" | "Actions" | "Finance" | "Communication";
  description: string;
  status: "Active" | "Draft" | "Paused";
  severity: "Low" | "Medium" | "High" | "Critical";
  triggeredCount: number;
  lastTriggered?: string;
}

export interface LatencyMetrics {
  evidence_retrieval_ms: number;
  policy_retrieval_ms: number;
  parallel_retrieval_ms: number;
  evaluation_ms: number;
  total_guardrail_ms: number;
  agent_ms?: number;
  tool_execution_ms?: number;
}

export interface GuardrailResult {
  verdict: Verdict;
  risk: number;
  violations: string[];
  decision: Decision;
  reason: string;
  evidence: Evidence[];
  policies: Policy[];
  executed: boolean;
  latency: LatencyMetrics;
}

export interface AgentResponse {
  id: string;
  userInput: string;
  agentOutput: string;
  intent: string;
  traceType: "response" | "action";
  action?: ActionProposal;
  guardrail: GuardrailResult;
  timestamp: string;
}

export interface Trace {
  id: string;
  timestamp: string;
  trace_type: "response" | "action";
  user_input: string;
  agent_output: string;
  intent: string;
  verdict: Verdict;
  risk: number;
  violations: string[];
  decision: Decision;
  reason: string;
  evidence: Evidence[];
  policies: Policy[];
  action?: ActionProposal;
  action_params?: Record<string, string | number | boolean> | undefined;
  executed: boolean;
  latency: LatencyMetrics;
}

export interface SystemStatus {
  backend: "connected" | "degraded" | "offline";
  moss: "connected" | "degraded" | "offline";
  gemini: "connected" | "degraded" | "offline";
  environment: "LOCAL" | "STAGING" | "PRODUCTION";
  status: "Operational" | "Degraded" | "Investigating";
  currentLatencyMs: number;
}

export interface MetricSummary {
  label: string;
  value: string;
  delta: string;
  tone: "neutral" | "good" | "warn" | "danger";
}

export interface PerformancePoint {
  time: string;
  responseGuardrail: number;
  actionGuardrail: number;
  retrieval: number;
  evaluation: number;
}

export interface PerformanceSummary {
  responseGuardrail: { mean: number; median: number; p95: number; current: number };
  mossResponseRetrieval: { mean: number; median: number; p95: number; current: number };
  geminiResponseEvaluation: { mean: number; median: number; p95: number; current: number };
  actionGuardrail: { mean: number; median: number; p95: number; current: number };
  mossActionPolicyRetrieval: { mean: number; median: number; p95: number; current: number };
  geminiActionEvaluation: { mean: number; median: number; p95: number; current: number };
  points: PerformancePoint[];
}
