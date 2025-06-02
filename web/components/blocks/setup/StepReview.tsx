"use client";

import React from "react";
import { FormData } from "./types";
import { ReviewRow } from "@/components/ui/ReviewRow";

interface StepReviewProps {
  formData: FormData;
}

export default function StepReview({ formData }: StepReviewProps) {
  const {
    display_name,
    brand_or_company,
    sns_handle,
    primary_sns_channel,
    platforms,
    follower_count,
    locale,
    tone_preferences,
    logo_url,
  } = formData;
  const otherPlatforms = platforms
    ? platforms.split(",").map((p) => p.trim()).filter(Boolean)
    : [];
  return (
    <div className="space-y-4 text-sm">
      <ReviewRow label="Display Name" value={display_name} />
      <ReviewRow label="Brand or Company" value={brand_or_company} />
      <ReviewRow label="SNS Handle" value={sns_handle} />
      <ReviewRow label="Primary SNS Channel" value={primary_sns_channel} />
      <ReviewRow
        label="Other Platforms"
        value={otherPlatforms.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-1">
            {otherPlatforms.map((p, idx) => (
              <span key={idx} className="px-2 py-0.5 text-xs bg-muted rounded-full">{p}</span>
            ))}
          </div>
        ) : undefined}
      />
      <ReviewRow label="Follower Count" value={follower_count} />
      <ReviewRow label="Locale" value={locale} />
      <ReviewRow label="Tone Preferences" value={tone_preferences} />
      {logo_url && (
        <ReviewRow
          label="Logo"
          value={
            <img src={logo_url} alt="Logo" className="w-24 h-24 object-contain rounded border" />
          }
        />
      )}
    </div>
  );
}