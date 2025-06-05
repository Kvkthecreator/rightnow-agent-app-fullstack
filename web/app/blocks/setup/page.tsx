"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionContext } from "@supabase/auth-helpers-react";
import Shell from "@/components/layouts/Shell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import CoreBlockForm from "@/components/blocks/CoreBlockForm";
import { CORE_BLOCKS_SETUP } from "@/constants/coreBlocks";
import { createBlock } from "@/lib/supabase/blocks";

export default function BlockSetupPage() {
  const { session, isLoading } = useSessionContext();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [label, setLabel] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  if (isLoading) return null;
  if (!session) {
    router.replace("/login");
    return null;
  }

  const stepInfo = CORE_BLOCKS_SETUP[step];

  async function handleNext() {
    setSaving(true);
    await createBlock({
      user_id: session.user.id,
      type: stepInfo.type,
      label,
      content,
      update_policy: "manual",
      is_core_block: true, // mark as one of the required core blocks
    });
    setSaving(false);
    setLabel("");
    setContent("");
    if (step + 1 < CORE_BLOCKS_SETUP.length) {
      setStep(step + 1);
    } else {
      router.push("/blocks");
    }
  }

  return (
    <Shell>
      <div className="max-w-xl mx-auto">
        <Card className="relative space-y-6">
          {saving && <LoadingOverlay message="Saving..." />}
          <h2 className="text-xl font-semibold">{stepInfo.title}</h2>
          <CoreBlockForm
            title={stepInfo.title}
            prompt={stepInfo.prompt}
            label={label}
            content={content}
            onLabelChange={setLabel}
            onContentChange={setContent}
          />
          <div className="flex justify-end">
            <Button onClick={handleNext} disabled={saving}>
              {step + 1 < CORE_BLOCKS_SETUP.length ? "Next" : "Finish"}
            </Button>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
