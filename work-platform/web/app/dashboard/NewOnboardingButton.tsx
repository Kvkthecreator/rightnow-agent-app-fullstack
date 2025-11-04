"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import NewOnboardingDialog from '@/components/NewOnboardingDialog';

export function NewOnboardingButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
      >
        🚀 New Onboarding (Phase 6)
      </Button>
      <NewOnboardingDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
