"use client";

import React from "react";
import { FormData } from "../types";

interface ReviewProfileProps {
  formData: FormData;
}

export default function ReviewProfile({ formData }: ReviewProfileProps) {
  return (
    <div className="space-y-2 text-sm">
      <div><strong>Display Name:</strong> {formData.display_name}</div>
      <div><strong>SNS Handle:</strong> {formData.sns_handle}</div>
      <div><strong>Primary SNS Channel:</strong> {formData.primary_sns_channel}</div>
      <div><strong>Other Platforms:</strong> {formData.platforms}</div>
      <div><strong>Follower Count:</strong> {formData.follower_count}</div>
      <div><strong>Locale:</strong> {formData.locale}</div>
      <div><strong>Niche:</strong> {formData.niche}</div>
      <div><strong>Audience Goal:</strong> {formData.audience_goal}</div>
      <div><strong>Monetization Goal:</strong> {formData.monetization_goal}</div>
      <div><strong>Primary Objective:</strong> {formData.primary_objective}</div>
      <div><strong>Content Frequency:</strong> {formData.content_frequency}</div>
      <div><strong>Tone Keywords:</strong> {formData.tone_keywords}</div>
      <div><strong>Favorite Brands:</strong> {formData.favorite_brands}</div>
      <div><strong>Prior Attempts:</strong> {formData.prior_attempts}</div>
      <div><strong>Creative Barriers:</strong> {formData.creative_barriers}</div>
    </div>
  );
}