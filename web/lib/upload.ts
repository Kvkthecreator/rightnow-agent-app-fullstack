import { createClient } from "@/lib/supabaseClient";

/**
 * Uploads a file to Supabase Storage and returns its public (or signed) URL.
 *
 * @param file - File object to upload
 * @param entity - Namespace folder (e.g., 'task_briefs', 'profile_core')
 * @param id - Unique ID to scope this file (e.g., taskBrief.id or user.id)
 * @param options - Optional settings for visibility and filename override
 */
/**
 * Uploads a file to Supabase Storage and returns its public URL.
 * @param file - The file to upload
 * @param path - Full path within the bucket, e.g. 'task_briefs/1234/image.png'
 * @param bucket - Storage bucket name (default 'public')
 */
export async function uploadFile(
  file: File,
  path: string,
  bucket: string = "public"
): Promise<string> {
  const supabase = createClient();
  // Upload the file
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error || !data) {
    console.error("[uploadFile] Upload failed:", error);
    throw error || new Error("Upload failed");
  }
  // Get the public URL
  const { data: urlData, error: urlError } = supabase
    .storage
    .from(bucket)
    .getPublicUrl(data.path);
  if (urlError || !urlData?.publicUrl) {
    console.error("[uploadFile] getPublicUrl error:", urlError);
    throw urlError || new Error("Failed to retrieve public URL");
  }
  return urlData.publicUrl;
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
