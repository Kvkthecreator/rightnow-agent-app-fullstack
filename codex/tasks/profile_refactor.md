## codex/tasks/profile_refactor.md

🧩 Codex Task: Full Refactor of /profile-create Page

🎯 Goal
Refactor the /profile-create frontend flow to:

Match the new profile_core_data schema
Support image upload (to logo_url)
Be fully responsive for mobile
Clean up outdated logic from the old profiles table

✅ Part 1: Update DB Logic to Use profile_core_data

[CLI File: web/app/profile-create/page.tsx]

🔧 Change
Replace all Supabase queries referring to profiles with profile_core_data.
Replace the payload structure accordingly:

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
✅ Part 2: Introduce uploadToSupabase() and Add Logo Upload

[New CLI File: lib/upload.ts]

import { createClient } from "@/lib/supabaseClient";

export async function uploadToSupabase(file: File, userId: string) {
  const supabase = createClient();
  const bucket = "public";
  const filePath = `profiles/${userId}/${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      upsert: true,
    });

  if (uploadError) {
    throw new Error("Upload failed: " + uploadError.message);
  }

  const { data: urlData, error: urlError } = supabase
    .storage
    .from(bucket)
    .getPublicUrl(filePath);

  if (urlError) {
    throw new Error("URL fetch failed: " + urlError.message);
  }

  return urlData.publicUrl;
}
✅ Part 3: Add Logo Upload Field to Step 1 Form

[CLI File: components/profile-create/steps/ProfileBasics.tsx]

Add a logo input field and preview:

<input
  type="file"
  accept="image/*"
  onChange={async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const publicUrl = await uploadToSupabase(file, userId);
    onChange({ target: { name: "logo_url", value: publicUrl } });
  }}
/>

{formData.logo_url && (
  <img
    src={formData.logo_url}
    alt="Uploaded logo preview"
    className="w-24 h-24 object-contain rounded"
  />
)}
✅ Part 4: Responsive Layout Improvements

[CLI File: components/ui/ProgressStepper.tsx]

Replace horizontal layout with a media-query based vertical fallback:

<div className="flex flex-col sm:flex-row sm:items-center gap-2">
  {/* Stepper items */}
</div>
[CLI File: page.tsx]
Wrap entire container with:

<div className="max-w-md w-full mx-auto px-4 py-6">
✅ Part 5: Fix /profile to Use profile_core_data

[CLI File: web/app/profile/page.tsx]

Replace Supabase fetch query to:

supabase.from("profile_core_data")
  .select("*")
  .eq("user_id", session.user.id)
  .maybeSingle()
Display logo_url if available:

{profile.logo_url && (
  <img src={profile.logo_url} alt="Profile Logo" className="w-24 h-24 rounded" />
)}
✅ Bonus: Suggested Types Update

[CLI File: components/profile-create/types.ts]

export type FormData = {
  display_name: string;
  brand_or_company: string;
  sns_handle: string;
  primary_sns_channel: string;
  platforms: string;
  tone_preferences: string;
  locale: string;
  logo_url: string;
};
