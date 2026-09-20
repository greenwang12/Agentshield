<div align="center">

# AgentShield

### AI Reliability & Security Layer for Agentic Systems

**Gemini proposes. AgentShield evaluates and enforces.**  
Only `PASS` or confirmed `REVIEW` actions can ever reach execution.

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Moss](https://img.shields.io/badge/Moss-Retrieval-0ea5e9?style=for-the-badge)](https://www.moss.dev/)

[![Hackathon](https://img.shields.io/badge/YC%20Fall%202026%20×%20Moss-Zero%20Latency%20Builder%20Sprint-f97316?style=flat-square)](#hackathon)
[![Track](https://img.shields.io/badge/Track-Agent%20Reliability%2C%20Security%20%26%20Evaluation-6366f1?style=flat-square)](#hackathon)
[![Retrieval](https://img.shields.io/badge/Moss%20retrieval-~23%20ms-10b981?style=flat-square)](#performance)

<br/>

<img src="assets/agentshield_architecture_final.png" alt="AgentShield Architecture" width="90%"/>

<br/>

[**Why**](#-why-agentshield) •
[**How it works**](#-core-principle) •
[**Decisions**](#-pass--review--block) •
[**Live demos**](#-live-demos) •
[**Dashboard**](#-dashboard) •
[**API**](#-api) •
[**Get started**](#-getting-started)

</div>

---

## Overview

AgentShield is a **runtime reliability and security layer for AI agents**. It sits between an AI agent and its execution tools, evaluating every response and proposed action against **trusted knowledge** and **explicit safety policies** before anything is allowed to proceed.

It combines **Google Gemini**, **Moss retrieval**, runtime guardrails, human confirmation, and a local action simulator into a single, observable enforcement pipeline.

> [!IMPORTANT]
> The AI agent *never has direct access to execution.* It can only *propose actions.*

---

## Why AgentShield?

Letting an AI agent control real actions introduces serious risks. AgentShield puts an independent enforcement stage between the agent and execution to address them.

| Risk | How AgentShield responds |
|---|---|
| Hallucinated or unsupported information | Grounds responses in retrieved, trusted Moss knowledge |
| Unauthorized actions | Checks every proposal against explicit policies |
| Privacy & personal-data exposure | Blocks private-data sharing requests |
| Destructive or irreversible operations | Holds them for explicit human confirmation |
| Unapproved financial transactions | Financial-action policy triggers review |
| Unapproved external communication | Communication policy triggers review |
| Prompt-injection & untrusted-context risks | Evaluates proposals independently of the agent |
| No visibility into allow/block reasoning | Full traces, evidence, and incident views |

---

## Core Principle

```mermaid
flowchart TD
    U(["User Request"]) --> A["AI Agent<br/>(Gemini)"]
    A --> G{{"AgentShield Guardrail"}}
    G --> M[("Moss Retrieval<br/>FAQ Knowledge + Safety Policies")]
    M --> E["Gemini Risk Evaluation"]
    E --> D{"Decision Enforcement"}
    D -- "PASS" --> S["Action"]
    D -- "REVIEW" --> C["User Confirmation"]
    C -- "approved" --> S
    D -- "BLOCK" --> X["Execution Prevented"]

    classDef pass fill:#dcfce7,stroke:#16a34a,color:#14532d;
    classDef review fill:#fef9c3,stroke:#ca8a04,color:#713f12;
    classDef block fill:#fee2e2,stroke:#dc2626,color:#7f1d1d;
    classDef core fill:#e0e7ff,stroke:#4f46e5,color:#1e1b4b;
    class S pass;
    class C review;
    class X block;
    class G,E,M core;
```

---

## Architecture

The architecture **separates proposal generation from enforcement and execution.**

| Component | Responsibility |
|---|---|
| **React / TanStack Start** | Dashboard and user interaction |
| **FastAPI** | Backend API and orchestration |
| **Gemini** | Agent responses and structured action proposals |
| **AgentShield Guardrail** | Runtime evaluation and decision enforcement |
| **Moss FAQ Index** | Trusted knowledge retrieval |
| **Moss Policies Index** | Safety and authorization policies |
| **Gemini Risk Evaluation** | Risk assessment using retrieved context |
| **Action Simulator** | Safe local mock execution |
| **Local State** | Pending actions and application state |
| **Trace Store** | Runtime decision and execution traces |

---

## Trusted Retrieval with Moss

AgentShield uses **Moss** as its runtime retrieval layer, with two dedicated indexes: an FAQ knowledge base and a safety policy index.

### FAQ Knowledge Base

The AgentShield FAQ index contains:

- **130 documents**
- Domain-specific knowledge
- Synthetic demonstration knowledge
- Source identifiers on every retrieved document

Retrieved evidence is passed into the evaluation pipeline **before** any decision is made.

### Safety Policy Index

The policy index contains **10 AgentShield safety policies** covering:

`Reliability` · `Unsupported information` · `Unsafe actions` · `Relevance` · `Privacy` · `Destructive actions` · `Personal information` · `Financial actions` · `External communication` · `Account settings`

---

## Gemini Risk Evaluation

Gemini is used in **two separate stages**.

| Stage | Role | Output |
|:---:|---|---|
| **1. Agent Proposal** | Understands the request | A natural-language response **or** a structured action proposal |
| **2. Guardrail Evaluation** | Independently evaluates the proposal | A risk assessment and one of three enforcement decisions |

The evaluator weighs:

- Retrieved Moss evidence
- Applicable Moss policies
- The user request
- Action characteristics
- Authorization requirements
- Privacy considerations
- Safety constraints

---

## PASS / REVIEW / BLOCK

<table>
<tr>
<th width="33%" align="center">PASS🟢</th>
<th width="33%" align="center">REVIEW🟡</th>
<th width="33%" align="center">BLOCK🔴</th>
</tr>
<tr>
<td valign="top">The request satisfies the applicable safety requirements.</td>
<td valign="top">The action requires <b>explicit user confirmation</b>.</td>
<td valign="top">The action violates a safety or privacy requirement.</td>
</tr>
<tr>
<td valign="top"><b>→</b> Proceeds to the local Action Simulator.</td>
<td valign="top"><b>→</b> Held until the user approves it.</td>
<td valign="top"><b>→</b> Execution is prevented.</td>
</tr>
</table>

---

## Human-in-the-Loop

Sensitive actions are **never auto-executed** when confirmation is required. This gives you an explicit control point for destructive operations, financial actions, or unapproved external communication.

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant A as Gemini Agent
    participant S as AgentShield
    participant M as Moss
    participant X as Action Simulator

    U->>A: "Delete my account"
    A->>S: Propose DELETE_ACCOUNT
    S->>M: Retrieve FAQ evidence + policies
    M-->>S: Evidence + applicable policies
    S->>S: Gemini risk evaluation
    S-->>U: REVIEW — confirmation required
    U->>S: Confirm
    S->>X: Execute (simulated)
    X-->>U: Action completed
```

---

## Action Simulator

AgentShield uses a **local Action Simulator** instead of real external APIs, so interception and enforcement can be demonstrated **without performing any real-world operation.**

It can represent actions such as:

`Send email` · `Share private data` · `Book a service` · `Issue refund` · `Change account settings` · `Delete account`

> [!NOTE]
> Only approved actions ever reach execution.

<table>
<tr>
<td width="50%" align="center">
<img src="assets/actiondone.png" alt="Executed Action" width="100%"/>
<br/><sub><b>Approved action executed</b></sub>
</td>
<td width="50%" align="center">
<img src="assets/actions.png" alt="Action Monitoring" width="100%"/>
<br/><sub><b>Action monitoring</b></sub>
</td>
</tr>
</table>

---

## Live Demos

### Privacy Protection — `BLOCK`

A user requests another person's private information.

```mermaid
flowchart LR
    U(["'Give me Customer's private<br/>billing phone number.'"]) --> G["Gemini proposes<br/>SHARE_PRIVATE_DATA"]
    G --> P["Privacy policies<br/>retrieved"]
    P --> R["Risk evaluation"]
    R --> B["BLOCK"]

    classDef block fill:#fee2e2,stroke:#dc2626,color:#7f1d1d;
    class B block;
```

<div align="center">

<img src="assets/liveagent.png" alt="Blocked Privacy Request" width="90%"/>

| Decision | Risk | Action |
|:---:|:---:|:---:|
| **BLOCK** | **95 / 100** | `SHARE_PRIVATE_DATA` |

<sub>The proposed action was prevented from execution.</sub>

</div>

### Financial Action — `REVIEW`

Financial actions are evaluated against the applicable policy before execution. A refund that requires confirmation **stays under AgentShield control** until the required confirmation is provided.

<table>
<tr>
<td width="50%" align="center">
<img src="assets/issuerefundreq.png" alt="Refund Request" width="100%"/>
<br/><sub><b>1. Refund request</b></sub>
</td>
<td width="50%" align="center">
<img src="assets/issuerefundreview.png" alt="Refund Review" width="100%"/>
<br/><sub><b>2. Held for review</b></sub>
</td>
</tr>
</table>

### Example Scenarios

| Scenario | Proposed action | What AgentShield does | Outcome |
|---|---|---|:---:|
| Normal knowledge request | Gemini response | Moss FAQ retrieval → guardrail evaluation | **PASS** |
| Privacy-sensitive request | `SHARE_PRIVATE_DATA` | Privacy policy retrieval → risk evaluation | **BLOCK** |
| Destructive action | `DELETE_ACCOUNT` | Policy evaluation → explicit user confirmation → simulator | **REVIEW** |
| Financial action | `ISSUE_REFUND` | Financial policy evaluation → user confirmation → simulator | **REVIEW** *(when confirmation is required)* |

---

## Dashboard

The AgentShield dashboard provides runtime visibility into the system. It displays:

- Requests analyzed
- Actions intercepted
- Blocked actions
- Review actions
- Guardrail latency
- Moss retrieval latency
- Runtime pipeline status

<div align="center">

<img src="assets/dashboard.png" alt="AgentShield Dashboard" width="95%"/>

<sub><b>Main dashboard</b></sub>

</div>

---

## Incidents

Blocked or high-risk interactions can be inspected through the incident view. It provides visibility into:

- User request
- Proposed action
- Risk level
- Violated policies
- Evaluation reason
- Runtime trace

<div align="center">

<img src="assets/incidents.png" alt="Incidents" width="95%"/>

<sub><b>Incident view</b></sub>

</div>

---

## Evidence

The Evidence view provides visibility into the knowledge retrieved from Moss during runtime. It displays:

- Retrieved documents
- Document identifiers
- Knowledge categories
- Retrieval information
- Verified evidence used by the guardrail

<div align="center">

<img src="assets/evidence.png" alt="Evidence" width="95%"/>

<sub><b>Evidence view</b></sub>

</div>

---

## Policies

The Policies view exposes the safety policies used by AgentShield, covering:

- Reliability
- Safety
- Privacy
- Financial actions
- Communication
- Account changes
- Confirmation requirements

<div align="center">

<img src="assets/policies.png" alt="Policies" width="95%"/>

<sub><b>Policies view</b></sub>

</div>

---

## Performance

AgentShield records latency across the runtime pipeline, including Moss retrieval, Gemini evaluation, guardrail processing, and overall response latency.

<div align="center">

<img src="assets/performance.png" alt="Performance" width="95%"/>

<sub><b>Performance view</b></sub>

</div>

### Measured Runtime Example

| Metric | Measured |
|---|---:|
| Overall response — mean | **~956 ms** |
| Overall response — median | **~908 ms** |
| Overall response — P95 | **~1063 ms** |
| Moss retrieval — mean | **~22.74 ms** |
| Moss retrieval — P95 | **~24.14 ms** |
| Gemini evaluation — mean | **~933 ms** |

> [!NOTE]
> These are implementation measurements and can vary depending on runtime conditions.

---

## Settings

AgentShield also provides a runtime configuration and system settings view.

<div align="center">

<img src="assets/settings.png" alt="Settings" width="95%"/>

<sub><b>Settings view</b></sub>

</div>

---

## Security Model

AgentShield follows a **separation-of-responsibilities** model.

| Role | Responsible for |
|---|---|
| **AI Agent** | Understanding the request · Generating responses · Proposing structured actions |
| **AgentShield** | Retrieving trusted context · Retrieving applicable policies · Evaluating risk · Enforcing the decision · Requiring confirmation when necessary |
| **Action Simulator** | Simulating approved execution · Updating local application state |

> [!IMPORTANT]
> The agent does **not** have a direct execution path to the execution layer.

---

## Observability

Every request records:

| | | |
|---|---|---|
| User input | Agent output | Intent |
| Proposed action | Retrieved evidence | Retrieved policies |
| Risk score | Decision | Evaluation reason |
| Execution status | Latency measurements | |

Local runtime data is stored in:

```text
backend/
├── app_state.json
└── traces.jsonl
```

These are local runtime state files and are excluded from version control.

---

## API

### Agent

| Method | Endpoint | Description |
|:---:|---|---|
| `POST` | `/agent/messages` | Processes a user request through the AgentShield pipeline |

### Actions

| Method | Endpoint | Description |
|:---:|---|---|
| `GET` | `/actions` | Returns intercepted actions and their current status |
| `POST` | `/actions/{id}/confirm` | Confirms an action requiring human approval |
| `POST` | `/actions/{id}/execute` | Executes an approved action through the local simulator |

### Monitoring

| Method | Endpoint | Description |
|:---:|---|---|
| `GET` | `/status` | Pipeline status |
| `GET` | `/policies` | Safety policies |
| `GET` | `/evidence` | Retrieved evidence |
| `GET` | `/traces` | Runtime traces |
| `GET` | `/metrics` | Latency metrics |
| `GET` | `/state` | Application state |
| `GET` | `/health` | Health check |

---

## Tech Stack

<div align="center">

| Layer | Technologies |
|:---:|---|
| **Frontend** | ![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB) ![TanStack](https://img.shields.io/badge/TanStack%20Start-EF4444) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white) |
| **Backend** | ![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white) ![Pydantic](https://img.shields.io/badge/Pydantic-E92063?logo=pydantic&logoColor=white) |
| **AI** | ![Gemini](https://img.shields.io/badge/Google%20Gemini%20API-8E75B2?logo=googlegemini&logoColor=white) |
| **Retrieval** | ![Moss](https://img.shields.io/badge/Moss-0ea5e9) |
| **Storage** | ![JSON](https://img.shields.io/badge/Local%20JSON-000000?logo=json&logoColor=white) ![JSONL](https://img.shields.io/badge/JSONL-475569) |

</div>

---

## Project Structure

```text
AgentShield/
│
├── backend/
│   ├── actions.py
│   ├── action_simulator.py
│   ├── agent.py
│   ├── attack_simulator.py
│   ├── chat.py
│   ├── config.py
│   ├── evaluator.py
│   ├── guardrail.py
│   ├── incident_trace.py
│   ├── intent_router.py
│   ├── knowledge_loader.py
│   ├── latency_report.py
│   ├── main.py
│   ├── moss_service.py
│   ├── server.py
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── assets/
│   ├── actiondone.png
│   ├── actions.png
│   ├── agentshield_architecture_final.png
│   ├── dashboard.png
│   ├── evidence.png
│   ├── incidents.png
│   ├── issuerefundreq.png
│   ├── issuerefundreview.png
│   ├── liveagent.png
│   ├── performance.png
│   ├── policies.png
│   └── settings.png
│
├── .gitignore
├── PRD.md
└── README.md
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/greenwang12/Agentshield.git
cd Agentshield
```

### 2. Backend setup

Create and activate a Python virtual environment:

<details open>
<summary><b>Windows (PowerShell)</b></summary>

```powershell
py -3.11 -m venv venv
.\venv\Scripts\Activate.ps1
```

</details>

<details>
<summary><b>macOS / Linux</b></summary>

```bash
python3.11 -m venv venv
source venv/bin/activate
```

</details>

Install the required packages:

```bash
pip install fastapi uvicorn python-dotenv pydantic google-genai moss
```

### 3. Configure environment variables

Create `backend/.env`:

```env
MOSS_PROJECT_ID=your_moss_project_id
MOSS_PROJECT_KEY=your_moss_project_key
GEMINI_API_KEY=your_gemini_api_key
```

> [!WARNING]
> Never commit API keys to Git.

### 4. Start the backend

```bash
cd backend
uvicorn server:app --reload
```

Runs at **http://127.0.0.1:8000**

### 5. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Normally runs at **http://localhost:5173**

---

## Configuration

The backend expects two Moss search indexes:

| Index | Contents |
|---|---|
| `faq` | **130** documents |
| `policies` | **10** policies |

---

## Design Goals

| | Goal | Description |
|:---:|---|---|
| 1 | **Reliability** | Ground AI responses in retrieved knowledge instead of relying entirely on model-generated information |
| 2 | **Security** | Separate agent proposal generation from action execution |
| 3 | **Policy Enforcement** | Evaluate actions against explicit safety and authorization policies |
| 4 | **Human Control** | Require explicit confirmation for sensitive actions |
| 5 | **Observability** | Expose the evidence, policies, decisions, and latency involved in each evaluation |

---

## Documentation

- [Product Requirements Document](PRD.md)
- [Architecture Diagram](assets/agentshield_architecture_final.png)

---

## Future Scope

- Integration with real external APIs and enterprise tools
- Expanded policy and knowledge coverage
- More advanced prompt-injection and adversarial testing
- Additional agent frameworks and model providers
- Distributed and scalable deployment
- Advanced analytics and security monitoring
- Automated policy management and versioning
  
---

## License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

<div align="center">

<br/>

**AgentShield** — *let agents propose, never let them decide alone.*

</div>
