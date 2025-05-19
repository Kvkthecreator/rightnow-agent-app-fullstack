"use client";

import React from "react";
import { FormData } from "../types";

interface DeepDiveDetailsProps {
  formData: FormData;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
}


export default function DeepDiveDetails({ formData, onChange }: DeepDiveDetailsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Niche</label>
        <input
          name="niche"
          value={formData.niche}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Audience Goal</label>
        <input
          name="audience_goal"
          value={formData.audience_goal}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Monetization Goal</label>
        <input
          name="monetization_goal"
          value={formData.monetization_goal}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Primary Objective</label>
        <select
          name="primary_objective"
          value={formData.primary_objective}
          onChange={onChange}
          required
          className="mt-1 block w-full border rounded p-2"
        >
          <option value="">Select a primary objective</option>
          <option value="enhance_engagement">Enhance engagement</option>
          <option value="connect_with_people">Connect with people</option>
          <option value="motivational">Motivational</option>
          <option value="help_others">Help others</option>
          <option value="educate">Educate</option>
          <option value="raise_awareness">Raise awareness</option>
          <option value="brand_sponsorships">Brand sponsorships</option>
          <option value="build_personal_brand">Build personal brand</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Content Frequency</label>
        <input
          name="content_frequency"
          value={formData.content_frequency}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Tone Keywords (comma-separated)</label>
        <input
          name="tone_keywords"
          value={formData.tone_keywords}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
          placeholder="relatable, calm, inspiring"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Favorite Brands (comma-separated)</label>
        <input
          name="favorite_brands"
          value={formData.favorite_brands}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
          placeholder="Headspace, Emma Chamberlain"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Prior Attempts</label>
        <textarea
          name="prior_attempts"
          value={formData.prior_attempts}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Creative Barriers</label>
        <textarea
          name="creative_barriers"
          value={formData.creative_barriers}
          onChange={onChange}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>
    </div>
  );
}