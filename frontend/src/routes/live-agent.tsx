import { createFileRoute } from "@tanstack/react-router";
import { LiveAgentPage } from "@/pages/LiveAgentPage";

export const Route = createFileRoute("/live-agent")({
  head: () => ({
    meta: [
      { title: "Live Agent — AgentShield" },
      {
        name: "description",
        content:
          "Talk to the guarded agent and watch the AgentShield inspector show intent, evidence, policies, risk, decision and latency per request.",
      },
      { property: "og:title", content: "Live Agent — AgentShield" },
      {
        property: "og:description",
        content:
          "Real-time agent workspace with a decision inspector and confirmation workflow for risky actions.",
      },
    ],
  }),
  component: LiveAgentPage,
});
