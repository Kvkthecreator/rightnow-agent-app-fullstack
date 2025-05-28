## codex/tasks/fix_upload_typing_and_add_buttons.md

## Task: Fix uploadFile typing and add domain-specific UploadButtons

### Problem Summary

1. The current `uploadFile(file, path, bucket)` method throws a TS error because its third argument (bucket) is typed as a union (`"task_briefs" | "profile_core"`), but a dynamic string like `${pathPrefix}/${filename}` is passed as the second argument (confusing TS inference).
2. We also want to create reusable UploadButtons scoped for:
   - Task Brief uploads → stored in Supabase bucket: `"task_briefs"`
   - Profile logo uploads → stored in Supabase bucket: `"profile_core"`

---

### ✅ Step-by-step Fixes

#### 1. **Update `upload.ts`**

Update the function signature to allow flexible `path` strings and a default `bucket` param.

```ts
// web/lib/upload.ts
export async function uploadFile(
  file: File,
  path: string,
  bucket: string = "task_briefs"
): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase
    .storage
    .from(bucket)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error || !data) {
    console.error("[uploadFile] upload error:", error);
    throw error || new Error("File upload failed");
  }

  const { data: urlData, error: urlError } = supabase
    .storage
    .from(bucket)
    .getPublicUrl(data.path);

  if (urlError || !urlData?.publicUrl) {
    throw urlError || new Error("Failed to get public URL");
  }

  return urlData.publicUrl;
}
