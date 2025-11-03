// web/components/library/types.ts

export interface FileEntry {
  id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  label: string;
  note?: string;
  size_bytes: number;
  created_at: string;
}
