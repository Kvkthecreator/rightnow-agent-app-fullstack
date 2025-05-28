// web/lib/upload.ts
import { createClient } from "@/lib/supabaseClient";

/**
 * Uploads a file to Supabase Storage and returns its public URL.
 * @param file File object to upload
 * @param bucket Which Supabase bucket to use (e.g. 'task_briefs' or 'profile_core')
 * @param path Full key path inside the bucket (e.g. 'media/123456-img.png')
 */
export async function uploadFile(file: File, bucket: string, path: string): Promise<string> {
  const supabase = createClient();

  // Upload the file
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error || !data) {
    console.error("[uploadFile] upload error:", error);
    throw error || new Error("File upload failed");
  }

  // Get the public URL directly
  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
  const publicUrl = publicData?.publicUrl;

  if (!publicUrl) {
    throw new Error("Failed to retrieve public URL");
  }

  return publicUrl;
}
