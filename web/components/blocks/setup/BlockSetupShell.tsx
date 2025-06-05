"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { createBlock } from "@/lib/supabase/blocks";
import { Card } from "@/components/ui/Card";
import { ProgressStepper } from "@/components/ui/ProgressStepper";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { motion, AnimatePresence } from "framer-motion";
import StepBasics from "./StepBasics";
import StepDetails from "./StepDetails";
import StepReview from "./StepReview";
import StepNav from "./StepNav";
import { CoreBlockFormData, Step } from "./types";

const CORE_TYPES = ["topic", "intent", "reference", "style_guide"];
const totalSteps = 4;

export default function BlockSetupShell() {
  const router = useRouter();
  const { session, isLoading: sessionLoading } = useSessionContext();

  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<CoreBlockFormData>({
    label: "",
    content: "",
    meta_tags: "",
    meta_context_scope: "",
    meta_emotional_tone: "",
    meta_locale: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  if (sessionLoading) return null;
  if (!session?.user) {
    router.replace("/login");
    return null;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  function resetForm() {
    setFormData({
      label: "",
      content: "",
      meta_tags: "",
      meta_context_scope: "",
      meta_emotional_tone: "",
      meta_locale: "",
    });
  }

  async function saveBlock(currentStep: Step) {
    if (!session?.user) {
      setError("You must be logged in to save this block.");
      return false;
    }
    const required = Object.values(formData);
    if (required.some((v) => !v || v.trim() === "")) {
      setError("Please fill in all fields before saving.");
      return false;
    }
    setLoading(true);
    setError(undefined);
    try {
      const payload = {
        user_id: session.user.id,
        label: formData.label,
        content: formData.content,
        type: CORE_TYPES[currentStep - 1],
        is_core_block: true,
        update_policy: "manual" as const,
        meta_tags: formData.meta_tags.split(",").map((s) => s.trim()).filter(Boolean),
        meta_context_scope: formData.meta_context_scope,
        meta_emotional_tone: formData.meta_emotional_tone
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        meta_locale: formData.meta_locale,
      };
      const { error: createError } = await createBlock(payload);
      if (createError) throw createError;
      return true;
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message || "Failed to save block.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  const handleNext = async () => {
    const ok = await saveBlock(step);
    if (!ok) return;
    resetForm();
    setStep((s) => ((s + 1) as Step));
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1) as Step);

  const handleFinish = async () => {
    const ok = await saveBlock(step);
    if (ok) {
      router.push("/blocks");
    }
  };

  return (
    <div className="max-w-md w-full mx-auto px-4 py-6">
      <div className="overflow-x-auto w-full mb-4">
        <ProgressStepper current={step} steps={CORE_TYPES} />
      </div>
      <Card className="relative space-y-6">
        {loading && <LoadingOverlay message="Saving your block..." />}
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={`step${step}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <StepBasics formData={formData} onChange={handleChange} />
            <StepDetails formData={formData} onChange={handleChange} />
            <StepReview formData={formData} />
          </motion.div>
        </AnimatePresence>
        <StepNav
          currentStep={step}
          totalSteps={totalSteps}
          onBack={handleBack}
          onNext={handleNext}
          onGenerate={handleFinish}
          loading={loading}
          error={error}
        />
      </Card>
    </div>
  );
}
