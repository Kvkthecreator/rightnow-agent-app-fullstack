import { createClient } from "@/lib/supabaseClient";

/**
 * Uploads a file to Supabase Storage 'public' bucket and returns its public URL.
 * @param file File object to upload
 * @param path Full path within the bucket (e.g. 'task_briefs/abc123/myimage.png')
 */
export async function uploadFile(file: File, path: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .storage
    .from("public")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error || !data) {
    console.error("[uploadFile] upload error:", error);
    throw error || new Error("File upload failed");
  }
  const { publicUrl, error: urlError } = supabase
    .storage
    .from("public")
    .getPublicUrl(data.path);
  if (urlError || !publicUrl) {
    console.error("[uploadFile] getPublicUrl error:", urlError);
    throw urlError || new Error("Failed to get public URL");
  }
  return publicUrl;
}