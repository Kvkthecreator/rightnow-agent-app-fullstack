// web/lib/upload.ts
import { createClient } from "@/lib/supabaseClient";

/**
 * Uploads a file to Supabase Storage and returns its public URL.
 * @param file File object to upload
 * @param path Full key path inside the bucket (e.g. 'media/123456-img.png')
 * @param bucket Supabase bucket name (e.g. 'task-media')
 */
export async function uploadFile(
  file: File,
  path: string,
  bucket: string = "task-media"
): Promise<string> {
  const supabase = createClient();

  // Upload the file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error || !data) {
    console.error("[uploadFile] upload error:", error);
    throw error || new Error("File upload failed");
  }

  // Get the public URL
  const { data: urlData } = supabase
    .storage
    .from(bucket)
    .getPublicUrl(path);

  if (!urlData?.publicUrl) {
    throw new Error("Failed to retrieve public URL");
  }

  return urlData.publicUrl;
}
