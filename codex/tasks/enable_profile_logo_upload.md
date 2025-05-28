## codex/tasks/enable_profile_logo_upload.md

# Task: Enable Profile Logo Upload in Profile Creation Flow

## Goal
Allow users to upload and store a brand logo as part of their profile creation (`ProfileCoreData.logo_url`) using Supabase Storage.

## Frontend Tasks
- [ ] Ensure `UploadButton` exists in `web/components/ui/UploadButton.tsx`.
- [ ] Update `ProfileBasics` (web/components/profile-create/steps/ProfileBasics.tsx):
  - Add file upload for `logo_url`:
    ```tsx
    <UploadButton
      pathPrefix="profile/logos"
      onUpload={(url) => onChange({ target: { name: 'logo_url', value: url } })}
      label="Upload Logo"
    />
    {formData.logo_url && (
      <img src={formData.logo_url} alt="Logo" className="h-16 mt-2" />
    )}
    ```
- [ ] Extend FormData type (web/components/profile-create/types.ts) to include `logo_url?: string`.
- [ ] In `web/app/profile-create/page.tsx`, include `logo_url` in the upsert payload sent to Supabase.

## Backend Tasks (Optional)
- [ ] Validate `logo_url` field format in profile upsert route (if needed).

## Supabase Setup
- [ ] Configure Supabase Storage bucket `profile_logos` (or use `public`).
- [ ] Add RLS to allow `authenticated` users to `insert`, `update`, and `select` their own logo files.

## Notes
- Reuse `uploadFile` helper in `web/lib/upload.ts`.
- Match styling from TaskBrief media upload UI.