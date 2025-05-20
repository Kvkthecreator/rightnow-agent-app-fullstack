"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSessionContext, useSupabaseClient } from "@supabase/auth-helpers-react";
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
  const supabase = useSupabaseClient();
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


  // Prefill form data if profile exists (edit mode)
  useEffect(() => {
    if (sessionLoading) return;
    if (!session || !session.user) {
      router.replace('/login');
      return;
    }
    async function loadProfile() {
      if (!session || !session.user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (error) {
        console.error("Error fetching profile for editing:", error);
        return;
      }
      if (data) {
        setFormData({
          display_name: data.display_name || "",
          sns_handle: data.sns_handle || "",
          primary_sns_channel: data.primary_sns_channel || "",
          platforms: Array.isArray(data.platforms) ? data.platforms.join(", ") : data.platforms || "",
          follower_count: data.follower_count?.toString() || "",
          locale: data.locale || "",
          niche: data.niche || "",
          audience_goal: data.audience_goal || "",
          monetization_goal: data.monetization_goal || "",
          primary_objective: data.primary_objective || "",
          content_frequency: data.content_frequency || "",
          tone_keywords: Array.isArray(data.tone_keywords) ? data.tone_keywords.join(", ") : data.tone_keywords || "",
          favorite_brands: Array.isArray(data.favorite_brands) ? data.favorite_brands.join(", ") : data.favorite_brands || "",
          prior_attempts: data.prior_attempts || "",
          creative_barriers: data.creative_barriers || "",
        });
      }
    }
    loadProfile();
  }, [session, sessionLoading, supabase, router]);
  // Redirect to login if session missing
  if (sessionLoading) {
    return <p>Loading...</p>;
  }
  if (!session || !session.user) {
    router.replace('/login');
    return <p>Loading...</p>;
  }

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
      setError("You must be logged in to create or update your profile.");
      return;
    }
    // Basic validation: ensure all fields are filled
    const required = [
      formData.display_name,
      formData.sns_handle,
      formData.primary_sns_channel,
      formData.platforms,
      formData.follower_count,
      formData.locale,
      formData.niche,
      formData.audience_goal,
      formData.monetization_goal,
      formData.primary_objective,
      formData.content_frequency,
      formData.tone_keywords,
      formData.favorite_brands,
      formData.prior_attempts,
      formData.creative_barriers,
    ];
    if (required.some((v) => !v || v.trim() === "")) {
      setError("Please fill in all fields before saving your profile.");
      return;
    }
    if (loading) return;
    setLoading(true);
    setError(undefined);
    try {
      // Upsert profile for single user
      const payload = {
        user_id: session.user.id,
        display_name: formData.display_name,
        sns_handle: formData.sns_handle,
        primary_sns_channel: formData.primary_sns_channel,
        platforms: formData.platforms.split(",").map((s) => s.trim()),
        follower_count: parseInt(formData.follower_count, 10) || 0,
        locale: formData.locale,
        niche: formData.niche,
        audience_goal: formData.audience_goal,
        monetization_goal: formData.monetization_goal,
        primary_objective: formData.primary_objective,
        content_frequency: formData.content_frequency,
        tone_keywords: formData.tone_keywords.split(",").map((s) => s.trim()),
        favorite_brands: formData.favorite_brands.split(",").map((s) => s.trim()),
        prior_attempts: formData.prior_attempts,
        creative_barriers: formData.creative_barriers,
      };
      // Upsert profile and retrieve the saved row
      const { data: upserted, error: upsertError } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "user_id" })
        .select()
        .single();
      if (upsertError) {
        throw upsertError;
      }

      // Call the Profile Analyzer agent
      try {
        const resp = await fetch("/api/profile_analyzer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile: payload,
            user_id: session.user.id,
            task_id: taskId,
          }),
        });
        if (!resp.ok) {
          throw new Error(`agent API ${resp.status}: ${await resp.text()}`);
        }
        const reportOutput = await resp.json();

        console.log("Agent report:", reportOutput);

        // Persist the returned sections
        if (reportOutput.sections && upserted?.id) {
          const profileId = upserted.id;

          // Delete old sections
          const { error: delError } = await supabase
            .from("profile_report_sections")
            .delete()
            .eq("profile_id", profileId);
          if (delError) {
            console.error("Error deleting old sections:", delError);
          }

          // Prepare new rows with order_index
          const sectionRows = reportOutput.sections.map((sec: any, idx: number) => ({
            profile_id: profileId,
            title: sec.title,
            body: sec.content,
            order_index: idx,
          }));

          // Insert new sections
          const { error: insertError } = await supabase
            .from("profile_report_sections")
            .insert(sectionRows);
          if (insertError) {
            console.error("Error saving profile report sections:", insertError);
          }
        }
      } catch (agentErr: any) {
        console.error("Error calling profile_analyzer:", agentErr);
        setError(
          "Profile saved but report generation failed: " + agentErr.message
        );
        setLoading(false);
        return;
      }

      // Redirect to profile view
      router.push("/profile");
    } catch (err: any) {
      setError(err.message || "Failed to save profile.");
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