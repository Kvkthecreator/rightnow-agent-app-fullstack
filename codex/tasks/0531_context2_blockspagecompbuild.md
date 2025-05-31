## codex/tasks/0531_context2_blockspagecompbuild.md

Task Name: 0531C_blocks_setup_refactor

Objective: Refactor the existing blocks/setup/page.tsx into modular subcomponents for maintainability and flexibility.

✅ Split Structure
1. Create New Folder:
web/components/blocks/setup/

2. Move and Refactor Page Content Into:

BlockSetupShell.tsx — Main wrapper component with state and step logic
StepBasics.tsx — Basic input fields (e.g. brand name, logo)
StepDetails.tsx — Detailed inputs (e.g. tone, audience)
StepReview.tsx — Final review screen
StepNav.tsx — Step navigation
types.ts — Shared types (FormData, StepState)
✅ New Page
Update web/app/blocks/setup/page.tsx to:

"use client";
import React from "react";
import BlockSetupShell from "@/components/blocks/setup/BlockSetupShell";

export default function BlockSetupPage() {
  return <BlockSetupShell />;
}
🔁 Migration Notes
Migrate any state handling and side effects into BlockSetupShell.tsx.
Keep each step component stateless and controlled via props.
Migrate FormData and related shared types into types.ts.
🧪 Ensure
Navigation logic remains unchanged
getBlocks and createBlock helpers still work as before
Styling and UX remain consistent with current UI
Please execute this patch and report back the results.

It looks like I tried sending the task to Codex directly, but since you're running it on your side, here's what you can do:

✅ Manual Instructions to Execute Patch Task 0531C
Step 1: Create Folder Structure

In your project directory, run:

mkdir -p web/components/blocks/setup
touch \
  web/components/blocks/setup/BlockSetupShell.tsx \
  web/components/blocks/setup/StepBasics.tsx \
  web/components/blocks/setup/StepDetails.tsx \
  web/components/blocks/setup/StepReview.tsx \
  web/components/blocks/setup/StepNav.tsx \
  web/components/blocks/setup/types.ts
Step 2: Update the Page

Replace web/app/blocks/setup/page.tsx with:

"use client";
import React from "react";
import BlockSetupShell from "@/components/blocks/setup/BlockSetupShell";

export default function BlockSetupPage() {
  return <BlockSetupShell />;
}
Step 3: Move Existing Logic to Shell

Copy all state, effect, and logic code (steps, form state, DB calls) into BlockSetupShell.tsx.

Each step component should only receive the relevant form state slice and step control props like onNext, onBack.
