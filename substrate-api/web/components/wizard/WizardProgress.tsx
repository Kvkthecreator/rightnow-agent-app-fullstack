"use client";

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export function WizardProgress({ currentStep, totalSteps, labels }: WizardProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => {
        const isActive = i === currentStep;
        const isCompleted = i < currentStep;

        return (
          <div key={i} className="flex items-center">
            <div
              className={`h-2 w-2 rounded-full transition-all ${
                isCompleted
                  ? 'bg-indigo-600'
                  : isActive
                  ? 'bg-indigo-500 scale-125'
                  : 'bg-slate-200'
              }`}
            />
            {labels?.[i] && (
              <span
                className={`ml-2 text-xs ${
                  isActive ? 'text-indigo-600 font-medium' : 'text-slate-400'
                }`}
              >
                {labels[i]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
