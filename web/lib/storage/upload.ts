import { createBrowserClient } from '@/lib/supabase/clients';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_MB } from '@/constants/uploads';

function isAllowedMime(type: string): boolean {
  return ALLOWED_MIME_TYPES.some((t) => {
    if (t.endsWith('/*')) {
      return type.startsWith(t.slice(0, -1));
    }
    return t === type;
  });
}

export async function uploadFile(file: File, path: string, bucket = 'block-files'): Promise<string> {
  if (!isAllowedMime(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`File size must be under ${MAX_FILE_SIZE_MB}MB.`);
  }
  const supabase = createBrowserClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error || !data) {
    throw new Error(`File upload failed: ${error?.message ?? 'no data returned'}`);
  }
  const { data: urlData, error: urlError } = supabase.storage.from(bucket).getPublicUrl(path);
  if (urlError || !urlData?.publicUrl) {
    throw new Error(`Failed to retrieve public URL: ${urlError?.message ?? 'unknown error'}`);
  }
  return urlData.publicUrl;
}
