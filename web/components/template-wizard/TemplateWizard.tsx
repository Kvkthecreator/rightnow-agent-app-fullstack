"use client";
import { Button } from "@/components/ui/Button";
import { ProgressStepper } from "@/components/ui/ProgressStepper";
import { useTemplateWizard } from "@/lib/hooks/useTemplateWizard";
import TemplatePicker from "@/components/template-flows/landing/TemplatePicker";

export function TemplateWizard() {
  const {
    stepIndex,
    stepLabels,
    next,
    back,
    selectTemplate,
    templateSteps,
    createBasket,
    fileUrls,
    setFileUrls,
    guidelines,
    setGuidelines,
    docCount,
    templateTitle,
  } = useTemplateWizard();

  const currentStep = (() => {
    if (stepIndex === 0) return TemplatePicker;
    return templateSteps[stepIndex - 1];
  })();

  const StepComponent = currentStep;

  return (
    <div className="w-full max-w-2xl space-y-4" data-testid="wizard">
      <ProgressStepper current={stepIndex + 1} steps={stepLabels} />
      {stepIndex > 0 && templateTitle && (
        <h2 className="text-xl font-semibold">{templateTitle}</h2>
      )}
      <div className="border rounded-md p-6 min-h-[150px]">
        {currentStep === TemplatePicker ? (
          <TemplatePicker onSelect={selectTemplate} />
        ) : (
          <StepComponent
            fileUrls={fileUrls}
            setFileUrls={setFileUrls}
            guidelines={guidelines}
            setGuidelines={setGuidelines}
          />
        )}
      </div>
      <div className="flex justify-between">
        {stepIndex > 0 && (
          <Button variant="ghost" onClick={back}>
            Back
          </Button>
        )}
        {stepIndex < templateSteps.length ? (
          <Button onClick={next} disabled={stepIndex === 1 && fileUrls.length < docCount}>
            Next
          </Button>
        ) : (
          <Button onClick={createBasket}>Create Basket</Button>
        )}
      </div>
    </div>
  );
}

