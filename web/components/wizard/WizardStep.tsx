"use client";

import { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface WizardStepProps {
  children: ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  backLabel?: string;
  showBack?: boolean;
  showNext?: boolean;
  isLoading?: boolean;
}

export function WizardStep({
  children,
  onNext,
  onBack,
  nextDisabled = false,
  nextLabel = 'Next',
  backLabel = 'Back',
  showBack = true,
  showNext = true,
  isLoading = false,
}: WizardStepProps) {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="min-h-[300px]">{children}</div>

      <div className="flex items-center justify-between gap-4">
        {showBack ? (
          <Button variant="ghost" onClick={onBack} disabled={isLoading}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backLabel}
          </Button>
        ) : (
          <div />
        )}

        {showNext && (
          <Button onClick={onNext} disabled={nextDisabled || isLoading}>
            {isLoading ? 'Processing...' : nextLabel}
            {!isLoading && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        )}
      </div>
    </div>
  );
}
