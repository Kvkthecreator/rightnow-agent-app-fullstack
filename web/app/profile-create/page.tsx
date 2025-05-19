"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSessionContext } from "@supabase/auth-helpers-react";
import StepIndicator from "@/components/profile-create/StepIndicator";
import StepNav from "@/components/profile-create/StepNav";
import ProfileBasics from "@/components/profile-create/steps/ProfileBasics";
import DeepDiveDetails from "@/components/profile-create/steps/DeepDiveDetails";
import ReviewProfile from "@/components/profile-create/steps/ReviewProfile";
import { FormData } from "@/components/profile-create/types";

const totalSteps = 3;

export default function ProfileCreatePage() {
  const router = useRouter();
  const { session, isLoading: sessionLoading } = useSessionContext();
  const [step, setStep] = useState<number>(1);
  const [taskId] = useState<string>(() => crypto.randomUUID());
  const [formData, setFormData] = useState<FormData>({
    display_name: "",
    sns_handle: "",
    primary_sns_channel: "",
    platforms: "",
    follower_count: "",
    locale: "",
    niche: "",
    audience_goal: "",
    monetization_goal: "",
    primary_objective: "",
    content_frequency: "",
    tone_keywords: "",
    favorite_brands: "",
    prior_attempts: "",
    creative_barriers: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => setStep((s) => Math.min(totalSteps, s + 1));
  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleGenerate = async () => {
    if (sessionLoading) {
      setError("Checking session...");
      return;
    }
    if (!session) {
      setError("You must be logged in to generate a report.");
      return;
    }
    // Basic validation: ensure all fields are filled
    const required = [
      formData.display_name,
      formData.sns_handle,
      formData.primary_sns_channel,
      formData.niche,
      formData.audience_goal,
      formData.monetization_goal,
      formData.primary_objective,
      formData.content_frequency,
      formData.tone_keywords,
      formData.favorite_brands,
      formData.prior_attempts,
      formData.creative_barriers,
      formData.locale,
      formData.platforms,
      formData.follower_count,
    ];
    if (required.some((v) => !v || v.trim() === "")) {
      setError("Please fill in all fields before generating report.");
      return;
    }
    if (loading) return;
    setLoading(true);
    setError(undefined);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      // Construct final payload
      const payload = {
        profile: {
          display_name: formData.display_name,
          sns_handle: formData.sns_handle,
          primary_sns_channel: formData.primary_sns_channel,
          platforms: formData.platforms.split(',').map((s) => s.trim()),
          follower_count: parseInt(formData.follower_count, 10),
          locale: formData.locale,
          niche: formData.niche,
          audience_goal: formData.audience_goal,
          monetization_goal: formData.monetization_goal,
          primary_objective: formData.primary_objective,
          content_frequency: formData.content_frequency,
          tone_keywords: formData.tone_keywords.split(',').map((s) => s.trim()),
          favorite_brands: formData.favorite_brands.split(',').map((s) => s.trim()),
          prior_attempts: formData.prior_attempts,
          creative_barriers: formData.creative_barriers,
        },
        user_id: session.user.id,
        task_id: taskId,
      };
      const res = await fetch(`${base}/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(`Error: ${text}`);
        return;
      }
      const data = await res.json();
      const { id } = data;
      if (id) {
        router.push(`/profile/${id}`);
      } else {
        setError("Invalid response from server: missing id");
      }
    } catch (err: any) {
      setError(`Request failed: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Profile Creation</h1>
      <StepIndicator current={step} total={totalSteps} />
      <div className="overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={`step${step}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {step === 1 && (
              <ProfileBasics formData={formData} onChange={handleChange} />
            )}
            {step === 2 && (
              <DeepDiveDetails formData={formData} onChange={handleChange} />
            )}
            {step === 3 && <ReviewProfile formData={formData} />}
          </motion.div>
        </AnimatePresence>
      </div>
      <StepNav
        currentStep={step}
        totalSteps={totalSteps}
        onBack={handleBack}
        onNext={handleNext}
        onGenerate={handleGenerate}
        loading={loading}
        error={error}
      />
    </div>
  );
}