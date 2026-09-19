import { createFileRoute } from "@tanstack/react-router";
import { IncidentsPage } from "@/pages/IncidentsPage";

export const Route = createFileRoute("/incidents")({
  head: () => ({
    meta: [
      { title: "Incidents — AgentShield" },
      {
        name: "description",
        content:
          "Investigate runtime traces: request, agent output, decision, risk, violations, evidence, policies, execution state and latency.",
      },
      { property: "og:title", content: "Incidents — AgentShield" },
      {
        property: "og:description",
        content: "Trace-level investigation of every flagged or blocked agent interaction.",
      },
    ],
  }),
  component: IncidentsPage,
});
