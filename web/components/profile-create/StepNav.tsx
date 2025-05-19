"use client";

import React from "react";

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
        <button
          onClick={onBack}
          disabled={currentStep === 1}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
        >
          Back
        </button>
        {currentStep < totalSteps ? (
          <button
            onClick={onNext}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Next
          </button>
        ) : (
          <button
            onClick={onGenerate}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>
        )}
      </div>
      {error && <div className="mt-2 text-red-600">{error}</div>}
    </>
  );
}