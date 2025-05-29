"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSessionContext, useSupabaseClient } from "@supabase/auth-helpers-react";
import StepNav from "@/components/profile-create/StepNav";
import ProfileBasics from "@/components/profile-create/steps/ProfileBasics";
import DeepDiveDetails from "@/components/profile-create/steps/DeepDiveDetails";
import ReviewProfile from "@/components/profile-create/steps/ReviewProfile";
import { FormData } from "@/components/profile-create/types";
import { ProgressStepper } from "@/components/ui/ProgressStepper";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";

const totalSteps = 3;

export default function ProfileCreatePage() {
  const router = useRouter();
  const { session, isLoading: sessionLoading } = useSessionContext();
  const supabase = useSupabaseClient();

  const [step, setStep] = useState<number>(1);
  const [taskId] = useState<string>(() => crypto.randomUUID());

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

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  // Prefill if profile exists
  useEffect(() => {
    if (sessionLoading) return;
    if (!session?.user) {
      router.replace("/login");
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("profile_core_data")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading existing profile:", error);
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
  }, [session, sessionLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => setStep((s) => Math.min(totalSteps, s + 1));
  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleGenerate = async () => {
    if (!session?.user) {
      setError("You must be logged in to save your profile.");
      return;
    }

    const requiredFields = Object.values(formData);
    if (requiredFields.some((v) => !v || v.trim() === "")) {
      setError("Please fill in all fields before saving your profile.");
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

      const { data: upserted, error: upsertError } = await supabase
        .from("profile_core_data")
        .upsert(payload, { onConflict: "user_id" })
        .select()
        .single();

      if (upsertError) throw upsertError;

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
        throw new Error(`Agent API error ${resp.status}: ${await resp.text()}`);
      }

      const reportOutput = await resp.json();

      if (reportOutput.report?.sections && upserted?.id) {
        await supabase
          .from("profile_report_sections")
          .delete()
          .eq("profile_id", upserted.id);

        const rows = reportOutput.report.sections.map((sec: any, idx: number) => ({
          profile_id: upserted.id,
          title: sec.title,
          body: sec.content,
          order_index: idx,
        }));

        await supabase.from("profile_report_sections").insert(rows);
      }

      router.push("/profile");
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message || "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) return <p>Loading...</p>;

  return (
    <div className="max-w-md w-full mx-auto px-4 py-6">
      <div className="overflow-x-auto w-full">
        <ProgressStepper current={step} steps={["Basics", "Details", "Review"]} />
      </div>
      <Card className="relative space-y-6">
        {loading && <LoadingOverlay message="Generating your report..." />}
        <h1 className="text-xl font-semibold">Profile Creation</h1>
        <div className="overflow-hidden">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div key={`step${step}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {step === 1 && <ProfileBasics formData={formData} onChange={handleChange} />}
              {step === 2 && <DeepDiveDetails formData={formData} onChange={handleChange} />}
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
      </Card>
    </div>
  );
}
