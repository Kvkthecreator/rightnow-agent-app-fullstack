"use client";

import React, { useState } from "react";
// Removed TextareaField (RHF) in favor of native <textarea>
import { TaskBriefUploadButton } from "@/components/ui/TaskBriefUploadButton";
import { Button } from "@/components/ui/Button";
import { useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
// Use built-in crypto for UUID generation

export default function TaskBriefCreatePage() {
  const user = useUser();
  const router = useRouter();

  const [intent, setIntent] = useState("");
  const [subInstructions, setSubInstructions] = useState("");
  const [media, setMedia] = useState<string[]>([]);

  const handleAddFile = (url: string) => {
    setMedia((prev) => [...prev, url]);
  };

  const handleSubmit = async () => {
    if (!intent.trim()) {
      alert("Intent is required.");
      return;
    }

    const brief = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      user_id: user?.id || "",
      intent,
      sub_instructions: subInstructions || "",
      media,
      created_at: new Date().toISOString(),
    };

    console.log("[DEBUG] Brief to submit:", brief);

    // TODO: Replace with actual Supabase insert logic or API call
    alert("Brief created (check console for payload)");
    router.push("/task-briefs"); // optional route after creation
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-semibold">New Task Brief</h1>

      <div className="space-y-4">
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
        <div>
          <TaskBriefUploadButton
            pathPrefix="briefs"
            onUpload={handleAddFile}
            label="Media (max 5)"
          />
          {media.length > 0 && (
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <p>Uploaded Files:</p>
              <ul className="list-disc list-inside">
                {media.map((url, i) => (
                  <li key={i}>{url}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <Button className="mt-6" onClick={handleSubmit}>
        Create Task Brief
      </Button>
    </div>
  );
}
