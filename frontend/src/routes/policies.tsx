import { createFileRoute } from "@tanstack/react-router";
import { PoliciesPage } from "@/pages/PoliciesPage";

export const Route = createFileRoute("/policies")({
  head: () => ({
    meta: [
      { title: "Policies — AgentShield" },
      {
        name: "description",
        content:
          "Manage the reliability, privacy, action, finance and communication policies that AgentShield enforces at runtime.",
      },
      { property: "og:title", content: "Policies — AgentShield" },
      {
        property: "og:description",
        content:
          "Policy catalogue with categories, severity, trigger counts and the traces where each policy fired.",
      },
    ],
  }),
  component: PoliciesPage,
});
