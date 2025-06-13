"use client";

import React from "react";
import { CoreBlockFormData } from "./types";
import { ReviewRow } from "@/components/ui/ReviewRow";

interface StepReviewProps {
  formData: CoreBlockFormData;
}

export default function StepReview({ formData }: StepReviewProps) {
  const { label, content, meta_tags, meta_context_scope, meta_emotional_tone, meta_locale } = formData;
  const tags = meta_tags ? meta_tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
  const tones = meta_emotional_tone ? meta_emotional_tone.split(',').map((t) => t.trim()).filter(Boolean) : [];
  return (
    <div className="space-y-4 text-sm">
      <ReviewRow label="Label" value={label} />
      <ReviewRow label="Content" value={content} />
      <ReviewRow
        label="Tags"
        value={tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-1">
            {tags.map((p, idx) => (
              <span key={idx} className="px-2 py-0.5 text-xs bg-muted rounded-full">{p}</span>
            ))}
          </div>
        ) : undefined}
      />
      <ReviewRow label="Context Scope" value={meta_context_scope} />
      <ReviewRow label="Emotional Tone" value={tones.join(', ')} />
      <ReviewRow label="Locale" value={meta_locale} />
    </div>
  );
}