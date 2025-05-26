## codex/tasks/design_profile_update.md

# Profile-Page & Profile-Create Refactor Tasks

Below is a list of tasks, in our standard TaskType format, to refactor the profile pages and profile-creation flow. Feed this to Codex and run each in turn.

```json
[
  {
    "id": "add_global_edit_toggle_to_profile",
    "title": "Add Global Edit Mode Toggle to Profile Page",
    "description": "Implement a single Edit/View toggle in the profile page header so report sections render in read-only mode by default and inline-editable when toggled into edit mode.",
    "agent_type": "assistant",
    "input_fields": [
      { "name": "layoutPath", "label": "Layout file path", "type": "string" },
      { "name": "pagePath",   "label": "Page file path",   "type": "string" }
    ],
    "prompt_template": "In `{{layoutPath}}` and `{{pagePath}}`, add an `editMode` boolean state with a button in the header to toggle it. When `editMode` is false render each report section as plain `<h3>` and `<p>`, and when true render your new `InputInline` and `TextareaInline` components (see next task). Expose Save/Cancel only on changed sections."
  },
  {
    "id": "scaffold_inline_edit_components",
    "title": "Scaffold Inline-Edit Input and Textarea Components",
    "description": "Create two new components, `InputInline` and `TextareaInline`, that look like plain text until focused, then show a subtle underline and focus ring (Notion-style).",
    "agent_type": "assistant",
    "input_fields": [
      { "name": "outputDir", "label": "Components directory", "type": "string" }
    ],
    "prompt_template": "Create `{{outputDir}}/InputInline.tsx` and `{{outputDir}}/TextareaInline.tsx`. Both should wrap the shadcn `<Input>`/`<Textarea>` with `variant='ghost'`, no border by default, and only a thin underline/focus ring on focus. Include minimal props (value, onChange, className)."
  },
  {
    "id": "wire_inline_components_into_steps",
    "title": "Wire Inline-Edit Components into Profile-Create Steps",
    "description": "Replace all standard `<Input>` and `<Textarea>` in the profile-creation steps (ProfileBasics, DeepDiveDetails, ReviewProfile) with the new inline components.",
    "agent_type": "assistant",
    "input_fields": [
      { "name": "stepsDir", "label": "Steps folder path", "type": "string" }
    ],
    "prompt_template": "In every file under `{{stepsDir}}` (`ProfileBasics.tsx`, `DeepDiveDetails.tsx`, `ReviewProfile.tsx`), import `InputInline` and `TextareaInline` instead of shadcn `Input`/`Textarea`, and replace each `<Input>` / `<Textarea>` usage accordingly, preserving props and layout."
  },
  {
    "id": "cleanup_legacy_section_buttons",
    "title": "Clean Up Per-Section Buttons in Profile Page",
    "description": "Remove redundant Delete/Save buttons on each section card and only show Save/Cancel in-context when a section is modified.",
    "agent_type": "assistant",
    "input_fields": [
      { "name": "pagePath", "label": "Profile page file path", "type": "string" }
    ],
    "prompt_template": "In `{{pagePath}}`, remove all per-section Delete and Save `<button>` elements. Instead, only render Save/Cancel controls when that section’s data is dirty, adjacent to its inline inputs."
  }
]
