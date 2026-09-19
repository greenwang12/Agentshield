import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { OverviewPage } from "@/pages/OverviewPage";
import { OnboardingPage } from "@/pages/OnboardingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — AgentShield" },
      {
        name: "description",
        content:
          "Live runtime overview of AgentShield: guardrail pipeline, requests analysed, actions intercepted and blocked decisions.",
      },
      { property: "og:title", content: "Overview — AgentShield" },
      {
        property: "og:description",
        content:
          "AI reliability infrastructure for autonomous agents: evidence, policies, risk and decisions in real time.",
      },
    ],
  }),
  component: Index,
});

const ONBOARDING_KEY = "agentshield.onboarded";

function Index() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem(ONBOARDING_KEY)) setShowOnboarding(true);
  }, []);

  if (showOnboarding) {
    return (
      <OnboardingPage
        onDismiss={() => {
          window.localStorage.setItem(ONBOARDING_KEY, "true");
          setShowOnboarding(false);
        }}
      />
    );
  }

  return <OverviewPage />;
}
