"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import OnboardingForm from "@/components/onboarding/OnboardingForm";

export default function OnboardingGate({ basketId }: { basketId: string }) {
  const [open, setOpen] = useState(false);

  if (open) {
    return <OnboardingForm basketId={basketId} />;
  }

  return (
    <div className="border rounded-md p-6 text-center space-y-4">
      <h2 className="text-xl font-semibold">Before we hold your thoughts, let’s start with you.</h2>
      <p className="text-muted-foreground">Yarnnn works best when it knows the human behind the thread.</p>
      <Button onClick={() => setOpen(true)}>Begin the Mirror</Button>
    </div>
  );
}
