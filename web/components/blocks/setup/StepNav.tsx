"use client";

import React from "react";
import { Button } from "@/components/ui/Button";

interface StepNavProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onGenerate: () => void;
  loading: boolean;
  error?: string;
}

export default function StepNav({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onGenerate,
  loading,
  error,
}: StepNavProps) {
  return (
    <>
      <div className="flex justify-between items-center mt-4">
        <Button variant="outline" size="md" onClick={onBack} disabled={currentStep === 1}>
          Back
        </Button>
        {currentStep < totalSteps ? (
          <Button onClick={onNext} size="md">
            Next
          </Button>
        ) : (
          <Button onClick={onGenerate} size="md" disabled={loading}>
            {loading ? "Generating..." : "Generate Report"}
          </Button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </>
  );
}