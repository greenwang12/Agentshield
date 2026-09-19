import { createFileRoute } from "@tanstack/react-router";
import { ActionsPage } from "@/pages/ActionsPage";

export const Route = createFileRoute("/actions")({
  head: () => ({
    meta: [
      { title: "Actions — AgentShield" },
      {
        name: "description",
        content:
          "Action security centre for email, private data, bookings, refunds, account settings and account deletion, with risk and policy state.",
      },
      { property: "og:title", content: "Actions — AgentShield" },
      {
        property: "og:description",
        content:
          "Review every agent-proposed action, its decision, risk score and the policies it triggered.",
      },
    ],
  }),
  component: ActionsPage,
});
