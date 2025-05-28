## codex/tasks/enable_supabase_file_uploads.md

## Task: Enable Supabase Storage Uploads for TaskBriefs and Profile Creation

### Summary

Scaffold file upload support using Supabase Storage for two key flows:

1. `TaskBrief.media`: allow up to 5 media items, each with an image or file and description.
2. `ProfileCoreData.logo_url`: allow uploading a brand logo during profile creation.

---

### Frontend Tasks

- [ ] Add Supabase client upload utility in `web/lib/upload.ts`.
- [ ] Create `UploadButton` UI component in `web/components/ui/UploadButton.tsx` using `input type="file"` and Supabase upload.
- [ ] Update `TaskBriefForm.tsx`:
  - Replace `image_url` input with file uploader using `UploadButton`.
  - Store uploaded file’s public URL into `media.image_url`.
- [ ] Update Profile creation UI (or `ProfileCoreForm.tsx`):
  - Add logo file upload, store result in `logo_url`.

---

### Backend Tasks

- [ ] No server logic is required for basic upload, but validate `media.image_url` and `logo_url` fields if additional safety is needed.

---

### Supabase Configuration

- [ ] Ensure a `public` bucket exists.
- [ ] Set RLS policies to restrict uploads to authenticated users.
- [ ] Allow `select`, `insert`, `update` on Storage files for `authenticated`.

---

### Optional

- [ ] Add `/api/upload-url` helper if you want to use signed URLs for upload security.
- [ ] Create a `useUploadMedia` React hook for shared file upload logic.

### Estimated Effort

`Frontend`: Medium  
`Supabase`: Low  
`Backend`: Minimal

