// web/lib/uploadFile.ts
import { createClient } from "@/lib/supabaseClient";

/**
 * Uploads a file to Supabase Storage and returns its public URL.
 * Validates file type, size, and allowed extensions.
 */
export async function uploadFile(
  file: File,
  path: string,
  bucket: string = "task-media"
): Promise<string> {
  const supabase = createClient();

  // Validate file type and size
  const maxSizeMB = 2;
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only JPG, PNG, GIF, or WEBP images are allowed.");
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error("File size must be under 2MB.");
  }

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
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!urlData?.publicUrl) {
    throw new Error("Failed to retrieve public URL");
  }

  return urlData.publicUrl;
}
