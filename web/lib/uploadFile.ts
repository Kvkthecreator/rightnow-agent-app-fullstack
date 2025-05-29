import { createClient } from "@/lib/supabaseClient";

/**
 * Uploads a file to Supabase Storage and returns its public URL.
 * @param file The File object to upload.
 * @param path The storage path within the bucket (e.g., "folder/filename.ext").
 * @param bucket The Supabase storage bucket name (default: "task-media").
 * @returns The public URL of the uploaded file.
 * @throws If validation fails, upload fails, or public URL retrieval fails.
 */
export async function uploadFile(
  file: File,
  path: string,
  bucket: string = "task-briefs"
): Promise<string> {
  const supabase = createClient();

  // Validate file type and size
  const maxSizeMB = 5;
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`File size must be under ${maxSizeMB}MB.`);
  }

  // Upload the file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error(`[uploadFile] upload error in bucket "${bucket}":`, error);
    const statusCode = (error as any)?.status;
    if (statusCode === 404) {
      throw new Error(`Storage bucket "${bucket}" not found.`);
    }
    throw new Error(`File upload failed: ${(error as any)?.message || "Unknown error"}`);
  }

  if (!data) {
    throw new Error("File upload failed: no data returned.");
  }

  // Get the public URL
  const result = supabase.storage.from(bucket).getPublicUrl(path);
  const urlData = result.data;
  const urlError = (result as any).error;

  if (urlError) {
    console.error(`[uploadFile] getPublicUrl error in bucket "${bucket}":`, urlError);
    throw new Error(`Failed to retrieve public URL: ${urlError.message}`);
  }

  if (!urlData?.publicUrl) {
    throw new Error(
      `Failed to retrieve public URL for path "${path}" in bucket "${bucket}".`
    );
  }

  return urlData.publicUrl;
}
