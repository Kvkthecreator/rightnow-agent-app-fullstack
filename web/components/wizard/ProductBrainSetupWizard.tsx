"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WizardProgress } from './WizardProgress';
import { WizardStep } from './WizardStep';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { Sparkles, Lightbulb } from 'lucide-react';

export type SetupWizardStepSpec = {
  id: string;
  field: string;
  question: string;
  prompt: string;
  placeholder?: string;
  optional?: boolean;
  minLength?: number;
  inputType?: 'textarea' | 'short';
  anchorRefs?: string[];
};

interface ProductBrainSetupWizardProps {
  basketId: string;
  steps: SetupWizardStepSpec[];
  basketName?: string;
}

export function ProductBrainSetupWizard({
  basketId,
  steps,
  basketName = 'your product',
}: ProductBrainSetupWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const storageKey = `setup-wizard-${basketId}`;

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setInputs(parsed.inputs || {});
        setCurrentStep(parsed.currentStep || 0);
      } catch {}
    }
  }, [storageKey]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ inputs, currentStep })
    );
  }, [inputs, currentStep, storageKey]);

  const validateStep = useCallback((stepIndex: number): boolean => {
    const step = steps[stepIndex];
    const value = inputs[step.field] || '';

    if (!step.optional && !value.trim()) {
      setErrors({ [step.field]: 'This field is required' });
      return false;
    }

    if (step.minLength && value.trim().length < step.minLength) {
      setErrors({
        [step.field]: `Please provide at least ${step.minLength} characters`,
      });
      return false;
    }

    setErrors({});
    return true;
  }, [inputs, steps]);

  const handleNext = useCallback(() => {
    if (!validateStep(currentStep)) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  }, [currentStep, steps.length, validateStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/baskets/${basketId}/setup-wizard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Setup failed');
      }

      const result = await response.json();

      // Clear localStorage
      localStorage.removeItem(storageKey);

      // Redirect to documents or governance based on response
      router.push(
        `/baskets/${basketId}/documents?setup_complete=1&profile_id=${result.profile_document_id || ''}`
      );
    } catch (error) {
      console.error('Setup wizard submission failed:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Setup failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [basketId, inputs, router, storageKey]);

  const step = steps[currentStep];
  const value = inputs[step.field] || '';
  const error = errors[step.field];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-indigo-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              Product Brain Setup
            </h1>
          </div>
          <p className="text-slate-600">
            Let's build the foundational substrate for {basketName}
          </p>
        </div>

        <WizardProgress
          currentStep={currentStep}
          totalSteps={steps.length}
        />

        <Card className="p-8 shadow-lg">
          <WizardStep
            onNext={handleNext}
            onBack={handleBack}
            nextDisabled={isSubmitting}
            nextLabel={currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
            showBack={currentStep > 0}
            isLoading={isSubmitting}
          >
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                  {step.question}
                </h2>
                <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-4">
                  <Lightbulb className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-indigo-900">{step.prompt}</p>
                </div>
              </div>

              <div>
                <Textarea
                  value={value}
                  onChange={(e) =>
                    setInputs({ ...inputs, [step.field]: e.target.value })
                  }
                  placeholder={step.placeholder}
                  rows={step.inputType === 'textarea' ? 8 : 4}
                  className={error ? 'border-red-300' : ''}
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
                {step.optional && (
                  <p className="mt-2 text-xs text-slate-500">
                    This step is optional
                  </p>
                )}
              </div>

              {step.anchorRefs && step.anchorRefs.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-xs text-slate-600 mb-2">
                    This input will seed these substrate anchors:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {step.anchorRefs.map((anchor) => (
                      <span
                        key={anchor}
                        className="inline-flex items-center px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full"
                      >
                        {anchor.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </WizardStep>
        </Card>

        {errors.submit && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {errors.submit}
          </div>
        )}

        <div className="mt-8 text-center text-xs text-slate-500">
          Step {currentStep + 1} of {steps.length}
        </div>
      </div>
    </div>
  );
}
