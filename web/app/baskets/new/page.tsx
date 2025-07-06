"use client";
export const dynamic = "force-dynamic";
import { CreationModeToggle } from "@/components/template-wizard/CreationModeToggle";
import { TemplateWizard } from "@/components/template-wizard/TemplateWizard";
import { ScratchCreation } from "@/components/template-wizard/ScratchCreation";
import { useCreationMode } from "@/lib/hooks/useCreationMode";
import { Suspense } from "react";

function NewBasketInner() {
  const { mode, setMode } = useCreationMode();
  return (
    <div className="flex flex-col items-center pt-8">
      <CreationModeToggle mode={mode} onChange={setMode} />
      {mode === "wizard" ? <TemplateWizard /> : <ScratchCreation />}
    </div>
  );
}

export default function NewBasketPage() {
  return (
    <Suspense>
      <NewBasketInner />
    </Suspense>
  );
}
