import { useState } from "react";

export type WizardStep = 0 | 1 | 2 | 3;

export function useTemplateWizard() {
  const [step, setStep] = useState<WizardStep>(0);

  const next = () => setStep((s) => (s < 3 ? ((s + 1) as WizardStep) : s));
  const back = () => setStep((s) => (s > 0 ? ((s - 1) as WizardStep) : s));

  const createBasket = () => {
    console.log("createBasket stub");
  };

  return { step, next, back, setStep, createBasket };
}
