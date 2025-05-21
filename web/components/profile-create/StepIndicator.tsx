"use client";

import React from "react";

interface StepIndicatorProps {
  current: number;
  total: number;
}

export default function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <div className="text-sm text-muted-foreground font-medium">
      Step {current} of {total}
    </div>
  );
}