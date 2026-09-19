import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/pages/SettingsPage";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AgentShield" },
      {
        name: "description",
        content:
          "Configure the AgentShield backend URL, environment, refresh interval, theme and notifications.",
      },
      { property: "og:title", content: "Settings — AgentShield" },
      {
        property: "og:description",
        content: "Runtime configuration and connection health for backend, Moss and Gemini.",
      },
    ],
  }),
  component: SettingsPage,
});
