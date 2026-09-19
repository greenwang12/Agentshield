# AgentShield — AI Reliability & Security Control Plane

Frontend for AgentShield: it protects, validates and monitors autonomous AI agent behaviour in real time.

Pipeline: `USER REQUEST → AI AGENT → AGENTSHIELD (intent → Moss evidence + Moss policy retrieval → evaluation → risk → decision) → APPROVE / REVIEW / BLOCK → response or tool execution`.

## Stack

- TanStack Start (React 19 + Vite 7) with file-based routing
- TypeScript, Tailwind CSS v4, shadcn/ui, Lucide icons
- Recharts for latency observability
- TanStack Query available for data fetching

## Setup

```sh
npm i
npm run dev      # http://localhost:8080
npm run build
```

## Screens

| Route          | Purpose                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------ |
| `/`            | Overview — interactive runtime pipeline, metrics, recent activity (first visit shows onboarding) |
| `/live-agent`  | Live Agent workspace + AgentShield inspector, review/confirm and block flows                     |
| `/actions`     | Action security centre for the six supported action types                                        |
| `/incidents`   | Trace investigation with decision timeline                                                       |
| `/policies`    | Policy catalogue, categories, trigger counts, related traces                                     |
| `/evidence`    | Moss retrieval explorer with search, relevance and retrieval timings                             |
| `/performance` | Latency observability (LOCAL MEASUREMENTS)                                                       |
| `/settings`    | Backend URL, environment, connection health, preferences                                         |

## Project structure

```
src/
  components/agentshield/   status pills, inspector, confirmation dialog, page shell, empty/loading/error states
  components/layouts/       app shell (sidebar, top bar, status/environment indicators)
  components/ui/            shadcn/ui primitives
  pages/                    page implementations, rendered by route files
  routes/                   TanStack route files + per-page metadata
  services/                 the only place that talks to the backend
  hooks/  types/  mocks/  utils/
```

## Types

`src/types/agentshield.ts` mirrors the backend contract: `AgentMessage`, `AgentResponse`, `ActionProposal`,
`GuardrailResult`, `Trace`, `Policy`, `Evidence`, `LatencyMetrics`, `SystemStatus`.

## Service layer / backend connection points

No component calls `fetch` directly. All backend access lives in `src/services/`:

| Function                              | Endpoint (expected)                                      |
| ------------------------------------- | -------------------------------------------------------- |
| `getSystemStatus()`                   | `GET /status`                                            |
| `getMetrics()`                        | `GET /metrics`                                           |
| `sendMessage()`                       | `POST /agent/message`                                    |
| `getTraces()` / `getAgentTrace(id)`   | `GET /traces`, `GET /traces/:id`                         |
| `getPolicies()` / `getPolicy(id)`     | `GET /policies`, `GET /policies/:id`                     |
| `getEvidence()` / `searchEvidence(q)` | `GET /evidence`, `GET /evidence?q=`                      |
| `executeAction()` / `confirmAction()` | `POST /actions/:id/execute`, `POST /actions/:id/confirm` |

### Replacing mocks with the real backend

1. Create `.env`:

   ```
   VITE_AGENTSHIELD_API_URL=http://localhost:8000
   VITE_AGENTSHIELD_USE_MOCKS=false
   ```

2. That's it for the happy path — each service function already branches on `apiConfig.useMocks` and falls
   through to `requestJson()` against the configured backend.
3. If a real endpoint path or payload differs, change it only inside `src/services/*.ts`. Keep the return
   shapes identical to `src/types/agentshield.ts`; nothing else in the app needs to change.
4. `src/mocks/agentshield.ts` is structurally identical to the backend payloads and stays useful for local
   development and tests.

## Notes

- Performance numbers are **local measurements**: Moss retrieval is ~22–27 ms, but the full guardrail
  pipeline averages ~950 ms because model evaluation dominates. The pipeline is not sub-10 ms end to end.
- No AI or guardrail logic is duplicated in the frontend — verdicts, risk and decisions always come from the backend.
- A blocked action can never be presented as executed; BLOCK disables execution and explains the policy reason.
