# Product Requirements Document (PRD): AgentShield — AI Reliability Layer

## 1. Executive Summary

AgentShield is a runtime reliability and security layer designed to sit between an AI agent and its execution environment. The system ensures that AI-generated responses and action proposals are vetted against trusted knowledge and safety policies before any action reaches execution.

**Core Principle:** Gemini proposes. AgentShield evaluates and enforces. Only PASS or confirmed REVIEW actions can reach execution.

---

## 2. Problem Statement

AI agents, while powerful, are prone to hallucinations, unauthorized actions, privacy leaks, and destructive behaviors. Current LLM implementations often lack a robust, independent enforcement layer, meaning a model might directly trigger an action it has hallucinated or one that violates organizational policy.

There is a critical need for a system that provides runtime guardrails, context validation, and human-in-the-loop intervention for sensitive operations.

---

## 3. Goals & Objectives

- **Increase Trustworthiness:** Provide a verifiable layer of security that prevents unvetted AI actions.

- **Runtime Guardrails:** Implement real-time evaluation of every agent proposal.

- **Context Validation:** Ensure agent outputs are grounded in trusted domain knowledge.

- **Policy Enforcement:** Apply granular safety rules to prevent unauthorized or harmful actions.

- **Observability:** Maintain a transparent audit trail of why actions were allowed, reviewed, or blocked.

---

## 4. Target Users / Stakeholders

- **AI Developers:** Building agentic workflows requiring safety boundaries.

- **Security & Compliance Officers:** Needing to audit AI behavior and enforce organizational policies.

- **End Users:** Interacting with AI agents who require assurance that the agent will not perform sensitive actions without consent.

---

## 5. Functional Requirements

### 5.1 User Interaction & Dashboard

- **Chat Interface:** A frontend for users to interact with the Gemini-powered agent.

- **Monitoring Dashboard:** Real-time visibility into agent responses, proposed actions, retrieved evidence, and active policies.

- **Incident View:** A dedicated view for tracking BLOCKED actions and policy violations.

- **Performance Metrics:** Display of retrieval and evaluation latency.

### 5.2 Agent Orchestration

- **Proposal Generation:** The system shall use the Google Gemini API to generate natural-language responses or structured action proposals.

- **Execution Isolation:** The agent shall have no direct path to the Action Execution Layer or local state; it only submits proposals to the backend.

### 5.3 Trusted Retrieval (Moss)

- **Factual Grounding:** Retrieve relevant evidence from the **Moss FAQ Index** (130 trusted documents) to validate agent claims.

- **Policy Retrieval:** Retrieve relevant safety rules from the **Moss Policies Index** (10 safety policies) based on the proposed action.

### 5.4 Risk Evaluation & Decision Enforcement

- **Risk Scoring:** Use Gemini to evaluate proposals against retrieved Moss context for hallucinations, privacy issues, and policy violations.

- **Decision Model:**

  - **PASS:** Safe actions proceed to the Action Execution Layer.

  - **REVIEW:** Sensitive actions are paused for explicit user confirmation.

  - **BLOCK:** Unsafe or policy-violating actions are rejected.

- **Explainability:** Every decision must include a clear reason based on the evaluation.

### 5.5 User Confirmation Flow

- **Manual Gate:** Actions flagged as REVIEW must remain in a pending state in `app_state.json`.

- **Explicit Approval:** The Action Execution Layer shall only process a REVIEW action after receiving a confirmation signal from the Frontend Dashboard.

### 5.6 Action Execution

- **Local Execution:** Approved actions are processed through a local Action Execution Layer using Python-based execution handlers.

- **Safety:** No real external APIs are called; all actions are handled locally for the current implementation.

---

## 6. Non-Functional Requirements

- **Performance:** Total guardrail latency (Retrieval + Evaluation) should be minimized to maintain a responsive user experience.

- **Reliability:** The system must fail-closed; if the guardrail fails, the action must not proceed to execution.

- **Security (Isolation):** The AI Agent does not directly access the Action Execution Layer; execution is controlled by the Backend Orchestrator and AgentShield decision layer.

- **Auditability:** Each decision records the evaluation reason, retrieved evidence/policies, decision, and execution outcome in the trace.

- **Scalability:** The architecture supports the addition of more Moss documents and policies without structural changes.

---

## 7. System Architecture Overview

The architecture follows a **gated enforcement flow**:

1. **Frontend Dashboard** sends user input to the **FastAPI Backend**.

2. **FastAPI Backend** requests a proposal from the **AI Agent (Gemini)**.

3. The proposal is sent to the **AgentShield Guardrail**.

4. **Guardrail Orchestration** triggers **Moss Retrieval** (FAQ & Policies).

5. **Gemini Risk Evaluation** analyzes the proposal using the retrieved context.

6. **Decision Enforcement** issues a verdict (PASS/REVIEW/BLOCK).

7. **Action Execution Layer** processes only PASS or confirmed REVIEW actions.

8. **Local State & Traces** are updated with the outcome.

---

## 8. Tech Stack

- **Frontend:** React, TanStack Start, Tailwind CSS.

- **Backend:** Python, FastAPI, Pydantic.

- **AI/LLM:** Google Gemini API.

- **Retrieval Engine:** Moss.

- **Data Storage:** Local File System (JSON/JSONL).

---

## 9. Data Requirements

- **Knowledge Base:** 130 documents indexed in Moss for factual grounding.

- **Policy Store:** 10 safety policies (Authorization, Privacy, Financial Controls, etc.) indexed in Moss.

- **Application State:** `app_state.json` for managing session data and pending actions.

- **Execution Traces:** `traces.jsonl` for logging evidence, policy matches, evaluation results, and outcomes.

---

## 10. API Specifications

- `POST /agent/messages`: Accepts user input; returns agent response/proposal with evaluation.

- `POST /actions/{action_id}/confirm`: Confirms a REVIEW action.

- `POST /actions/{action_id}/execute`: Processes an approved action through the Action Execution Layer.

- `GET /status`: Returns system health and status.

- `GET /policies`: Lists active safety policies.

- `GET /evidence`: Returns evidence retrieved from Moss.

- `GET /traces`: Returns decision and execution logs.

- `GET /metrics`: Returns performance data (latency, etc.).

- `GET /state`: Returns current local application state.

- `GET /health`: Basic health check endpoint.

---

## 11. Security Requirements

- **Separate Enforcement Stage:** Guardrail evaluation is performed as a separate enforcement stage after the agent produces its proposal, reducing the ability of an agent-generated response to directly control execution.

- **Data Protection:** Relevant evaluation results and execution traces are stored locally in `app_state.json` and `traces.jsonl` for observability and post-execution analysis.

- **Policy Coverage:** The system must evaluate against 10 specific categories, including privacy, destructive actions, and financial controls.

---

## 12. Deployment & Infrastructure

- **Environment:** Local Python environment with the FastAPI backend and React/TanStack Start frontend.

- **Retrieval Infrastructure:** Moss provides the retrieval layer; no separate external vector database is used.

- **Dependencies:** Requires Google Gemini API access.

---

## 13. Success Metrics

- **Safety Coverage:** Measure whether policy-violating actions are correctly routed to BLOCK or REVIEW during testing.

- **Confirmation Enforcement:** Verify that REVIEW actions cannot reach the Action Execution Layer without explicit user confirmation.

- **Grounded Evaluation:** Measure the detection of unsupported claims using retrieved Moss evidence.

- **Policy Enforcement:** Evaluate the correct application of the 10 safety policies.

- **Latency Tracking:** Monitor Moss retrieval, Gemini evaluation, and total guardrail latency.

---

## 14. Timeline & Milestones

- **Phase 1:** Core Backend & Gemini Integration (Completed).

- **Phase 2:** Moss Indexing (FAQ & Policies) (Completed).

- **Phase 3:** Guardrail Logic & Decision Enforcement (Completed).

- **Phase 4:** Frontend Dashboard & User Confirmation Flow (Completed).

- **Phase 5:** Action Execution Layer & Trace Logging (Completed).

---

## 15. Open Questions & Risks

- **Prompt Injection:** While the separate enforcement stage reduces risk, LLMs remain susceptible to complex prompt injection; continuous monitoring is required.

- **Latency:** The multi-stage retrieval and evaluation process adds latency compared to direct agent execution.

- **Local vs. External APIs:** The current system uses local execution handlers; transitioning to real external APIs will require additional authentication, authorization, validation, and error-handling layers.