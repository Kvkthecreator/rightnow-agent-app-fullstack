"use client";

import OnboardingDashboard from "@/components/onboarding/OnboardingDashboard";

export default function OnboardingGate({ basketId }: { basketId: string }) {
  return <OnboardingDashboard basketId={basketId} />;
}
