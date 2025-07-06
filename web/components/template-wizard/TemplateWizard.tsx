"use client";
import { Button } from "@/components/ui/Button";
import { ProgressStepper } from "@/components/ui/ProgressStepper";
import { useTemplateWizard } from "@/lib/hooks/useTemplateWizard";

const stepLabels = ["Start", "Upload", "Guidelines", "Review"];

export function TemplateWizard() {
  const { step, next, back, createBasket } = useTemplateWizard();

  return (
    <div className="w-full max-w-2xl space-y-4" data-testid="wizard">
      <ProgressStepper current={step + 1} steps={stepLabels} />
      <div className="border rounded-md p-6 text-center min-h-[150px]">
        <p>Wizard step {step + 1}</p>
      </div>
      <div className="flex justify-between">
        {step > 0 && (
          <Button variant="ghost" onClick={back}>
            Back
          </Button>
        )}
        {step < 3 ? (
          <Button onClick={next}>Next</Button>
        ) : (
          <Button onClick={createBasket}>Create Basket</Button>
        )}
      </div>
    </div>
  );
}
