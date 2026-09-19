import { createFileRoute } from "@tanstack/react-router";
import { PerformancePage } from "@/pages/PerformancePage";

export const Route = createFileRoute("/performance")({
  head: () => ({
    meta: [
      { title: "Performance — AgentShield" },
      {
        name: "description",
        content:
          "Guardrail latency observability: mean, median and P95 for retrieval and evaluation, plus a stage-by-stage latency waterfall.",
      },
      { property: "og:title", content: "Performance — AgentShield" },
      {
        property: "og:description",
        content: "Local latency measurements for the AgentShield guardrail pipeline.",
      },
    ],
  }),
  component: PerformancePage,
});
