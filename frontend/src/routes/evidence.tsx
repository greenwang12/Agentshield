import { createFileRoute } from "@tanstack/react-router";
import { EvidencePage } from "@/pages/EvidencePage";

export const Route = createFileRoute("/evidence")({
  head: () => ({
    meta: [
      { title: "Evidence — AgentShield" },
      {
        name: "description",
        content:
          "Search the verified documents Moss retrieves at runtime, with relevance scores and retrieval timings behind every verdict.",
      },
      { property: "og:title", content: "Evidence — AgentShield" },
      {
        property: "og:description",
        content: "Moss retrieval explorer: trusted evidence grounding each AgentShield decision.",
      },
    ],
  }),
  component: EvidencePage,
});
