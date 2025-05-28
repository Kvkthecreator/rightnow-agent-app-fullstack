"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
// Removed TextareaField in favor of native <textarea>
import { Button } from "@/components/ui/Button";
import { TaskBriefUploadButton } from "@/components/ui/TaskBriefUploadButton";
import { Card } from "@/components/ui/Card";

// TaskBrief and ProfileCoreData match PRD contracts
interface MediaItem {
  image_url: string;
  description: string;
}
interface ProfileCoreData {
  display_name?: string;
  brand_or_company?: string;
  sns_links?: Record<string, string>;
  tone_preferences?: string;
  logo_url?: string;
  locale?: string;
}
interface TaskBrief {
  id?: string;
  intent: string;
  sub_instructions?: string;
  media?: MediaItem[];
  core_profile_data?: ProfileCoreData;
  created_at?: string;
}

interface TaskBriefFormProps {
  onCreate: (brief: TaskBrief) => void;
}

export default function TaskBriefForm({ onCreate }: TaskBriefFormProps) {
  const [intent, setIntent] = useState("");
  const [subInstructions, setSubInstructions] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [coreProfile, setCoreProfile] = useState<ProfileCoreData | null>(null);
  const [loading, setLoading] = useState(false);

  // Optional: fetch existing profile core data
  useEffect(() => {
    fetch("/api/profile-core")
      .then((res) => res.json())
      .then((data) => setCoreProfile(data))
      .catch(() => {});
  }, []);

  const addMedia = () => {
    if (media.length >= 5) return;
    setMedia((prev) => [...prev, { image_url: "", description: "" }]);
  };
  const updateMedia = (idx: number, field: keyof MediaItem, value: string) => {
    setMedia((prev) => {
      const items = [...prev];
      items[idx] = { ...items[idx], [field]: value };
      return items;
    });
  };
  const removeMedia = (idx: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intent.trim()) {
      alert("Intent is required");
      return;
    }
    setLoading(true);
    const payload = {
      intent,
      sub_instructions: subInstructions || undefined,
      media: media.length ? media : undefined,
      core_profile_data: coreProfile || undefined,
    };
    try {
      const res = await fetch("/api/task-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const brief = await res.json();
      if (!res.ok) {
        alert("Error creating Task Brief: " + (brief.detail || res.status));
      } else {
        onCreate(brief);
      }
    } catch (err) {
      console.error("TaskBriefForm error:", err);
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <section>
          <label className="block text-sm font-medium text-gray-700">Intent</label>
          <textarea
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="Describe your task goal"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </section>
        <section>
          <label className="block text-sm font-medium text-gray-700">Sub instructions</label>
          <textarea
            value={subInstructions}
            onChange={(e) => setSubInstructions(e.target.value)}
            placeholder="Optional additional instructions"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </section>
        <section>
          <label className="block text-sm font-medium text-gray-700">Media (max 5)</label>
          {media.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <TaskBriefUploadButton
                pathPrefix="media"
                onUpload={(url) => updateMedia(idx, "image_url", url)}
                label="Upload Image"
              />
              <Input
                value={item.description}
                onChange={(e) => updateMedia(idx, "description", e.target.value)}
                placeholder="Description"
              />
              <Button type="button" variant="ghost" onClick={() => removeMedia(idx)}>
                Remove
              </Button>
            </div>
          ))}
          {media.length < 5 && (
            <Button type="button" variant="outline" onClick={addMedia}>
              + Add media
            </Button>
          )}
        </section>
        <div>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Task Brief"}
          </Button>
        </div>
      </form>
    </Card>
  );
}