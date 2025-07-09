"use client";
import { Button } from "@/components/ui/Button";
import { ProgressStepper } from "@/components/ui/ProgressStepper";
import { useTemplateWizard } from "@/lib/hooks/useTemplateWizard";
import UploadDocsStep from "./UploadDocsStep";

const stepLabels = ["Start", "Upload", "Guidelines", "Review"];

export function TemplateWizard() {
  const {
    step,
    next,
    back,
    createBasket,
    fileUrls,
    setFileUrls,
    guidelines,
    setGuidelines,
  } = useTemplateWizard();

  return (
    <div className="w-full max-w-2xl space-y-4" data-testid="wizard">
      <ProgressStepper current={step + 1} steps={stepLabels} />
      <div className="border rounded-md p-6 min-h-[150px]">
        {step === 1 && <UploadDocsStep onFilesChange={setFileUrls} />}
        {step === 2 && (
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={4}
            placeholder="Guidelines (optional)"
            value={guidelines}
            onChange={(e) => setGuidelines(e.target.value)}
          />
        )}
        {step === 3 && (
          <div className="space-y-2 text-sm">
            <p>{fileUrls.length} files uploaded.</p>
            {guidelines && <p>Guidelines: {guidelines}</p>}
          </div>
        )}
        {step === 0 && (
          <p className="text-center text-sm text-muted-foreground">Start Wizard</p>
        )}
      </div>
      <div className="flex justify-between">
        {step > 0 && (
          <Button variant="ghost" onClick={back}>
            Back
          </Button>
        )}
        {step < 3 ? (
          <Button onClick={next} disabled={step === 1 && fileUrls.length < 3}>
            Next
          </Button>
        ) : (
          <Button onClick={createBasket}>Create Basket</Button>
        )}
      </div>
    </div>
  );
}
