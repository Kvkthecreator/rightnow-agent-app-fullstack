"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { getBlocks, createBlock } from "@/lib/supabase/blocks";
import { Card } from "@/components/ui/Card";
import { ProgressStepper } from "@/components/ui/ProgressStepper";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { motion, AnimatePresence } from "framer-motion";
import StepBasics from "./StepBasics";
import StepDetails from "./StepDetails";
import StepReview from "./StepReview";
import StepNav from "./StepNav";
import { FormData, Step } from "./types";

const totalSteps = 3;

export default function BlockSetupShell() {
  const router = useRouter();
  const { session, isLoading: sessionLoading } = useSessionContext();

  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>({
    display_name: "",
    brand_or_company: "",
    sns_handle: "",
    primary_sns_channel: "",
    platforms: "",
    follower_count: "",
    locale: "",
    tone_preferences: "",
    logo_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  // Load existing block data
  useEffect(() => {
    if (sessionLoading) return;
    if (!session?.user) {
      router.replace("/login");
      return;
    }
    (async () => {
      const { data, error } = await getBlocks(session.user.id);
      if (error) {
        console.error("Error loading blocks:", error);
        return;
      }
      if (data) {
        setFormData({
          display_name: data.display_name || "",
          brand_or_company: data.brand_or_company || "",
          sns_handle: data.sns_links?.handle || "",
          primary_sns_channel: data.sns_links?.primary || "",
          platforms: Array.isArray(data.sns_links?.others)
            ? data.sns_links.others.join(", ")
            : "",
          follower_count: data.follower_count?.toString() || "",
          locale: data.locale || "",
          tone_preferences: data.tone_preferences || "",
          logo_url: data.logo_url || "",
        });
      }
    })();
  }, [session, sessionLoading, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => setStep((s) => Math.min(totalSteps, s + 1));
  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleGenerate = async () => {
    if (!session?.user) {
      setError("You must be logged in to save this block.");
      return;
    }
    const required = Object.values(formData);
    if (required.some((v) => !v || v.trim() === "")) {
      setError("Please fill in all fields before saving.");
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const payload = {
        user_id: session.user.id,
        display_name: formData.display_name,
        brand_or_company: formData.brand_or_company,
        sns_links: {
          primary: formData.primary_sns_channel,
          handle: formData.sns_handle,
          others: formData.platforms.split(",").map((s) => s.trim()),
        },
        tone_preferences: formData.tone_preferences,
        locale: formData.locale,
        logo_url: formData.logo_url,
      };
      const { data: upserted, error: upsertError } = await createBlock(payload);
      if (upsertError) throw upsertError;
      router.push("/blocks");
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message || "Failed to save block.");
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) return null;

  return (
    <div className="max-w-md w-full mx-auto px-4 py-6">
      <div className="overflow-x-auto w-full mb-4">
        <ProgressStepper current={step} steps={["Basics", "Details", "Review"]} />
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
            {step === 1 && <StepBasics formData={formData} onChange={handleChange} />}
            {step === 2 && <StepDetails formData={formData} onChange={handleChange} />}
            {step === 3 && <StepReview formData={formData} />}
          </motion.div>
        </AnimatePresence>
        <StepNav
          currentStep={step}
          totalSteps={totalSteps}
          onBack={handleBack}
          onNext={handleNext}
          onGenerate={handleGenerate}
          loading={loading}
          error={error}
        />
      </Card>
    </div>
  );
}