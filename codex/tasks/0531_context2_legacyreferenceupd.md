## codex/tasks/0531_context2_legacyreferenceupd.md

Apply the following safe replacements across the codebase:

1. Replace all `.from("user_files")` → `.from("block_files")`
   - Files: UploadToLibrary.tsx, UploadArea.tsx, insertUserFile.ts, UserLibraryCard.tsx

2. Replace all `.from("profile_core_data")` with:
   - `createBlock()` or `getBlocks()` import from `lib/supabase/blocks.ts` (depending on context)
   - Only update `blocks/setup/page.tsx` and `profile/page.tsx`
   - DO NOT rewrite the logic yet — just remove the direct Supabase call

3. Replace `<Link href="/profile-create">…` → `<Link href="/blocks/setup">…`
   - In `page.tsx`

4. Remove static imports from `@/components/profile-create/*`
   - In `blocks/setup/page.tsx`

Do not modify styles, component logic, or unrelated files. This is a targeted schema cleanup.
