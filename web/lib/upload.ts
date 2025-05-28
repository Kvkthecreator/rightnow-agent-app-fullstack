import { createClient } from "@/lib/supabaseClient";

/**
 * Uploads a file to Supabase Storage and returns its public (or signed) URL.
 *
 * @param file - File object to upload
 * @param entity - Namespace folder (e.g., 'task_briefs', 'profile_core')
 * @param id - Unique ID to scope this file (e.g., taskBrief.id or user.id)
 * @param options - Optional settings for visibility and filename override
 */
export async function uploadFile(
  file: File,
  entity: "task_briefs" | "profile_core",
  id: string,
  options?: { usePrivate?: boolean; filename?: string }
): Promise<string> {
  const supabase = createClient();
  const bucket = options?.usePrivate ? "private" : "public";

  const timestamp = Date.now();
  const sanitized = file.name.replace(/\s+/g, "-").toLowerCase();
  const filename = options?.filename ?? `${timestamp}-${sanitized}`;
  const fullPath = `${entity}/${id}/${filename}`;

  const { data, error } = await supabase
    .storage
    .from(bucket)
    .upload(fullPath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error || !data) {
    console.error("[uploadFile] Upload failed:", error);
    throw error || new Error("Upload failed");
  }

  if (options?.usePrivate) {
    const signed = await supabase
      .storage
      .from(bucket)
      .createSignedUrl(fullPath, 60 * 60); // 1hr signed URL
    if (!signed.data?.signedUrl) throw new Error("Signed URL generation failed");
    return signed.data.signedUrl;
  }

  const publicUrl = supabase
    .storage
    .from(bucket)
    .getPublicUrl(fullPath).data.publicUrl;

  if (!publicUrl) throw new Error("Failed to retrieve public URL");

  return publicUrl;
}

/**
 * Deletes a file from Supabase Storage.
 * Useful for cleanup or replacing media.
 *
 * @param path - Full storage path (e.g., 'task_briefs/abc/123.png')
 * @param isPrivate - Whether it’s in private or public bucket
 */
export async function deleteFile(path: string, isPrivate = false): Promise<void> {
  const supabase = createClient();
  const bucket = isPrivate ? "private" : "public";

  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    console.error("[deleteFile] Deletion failed:", error);
    throw error;
  }
}
