## codex/tasks/codex/tasks/tep-3-review-ui-and-auto-transition.md

✅ Codex Task: step-3-review-ui-and-auto-transition.md

## 📄 Task Title
Auto-transition to Step 3 and render review/editable profile fields

## 🎯 Goal
When all six profile fields are collected via the ProfileBuilder agent, automatically switch the user to Step 3 and display a table UI where they can review and optionally edit their answers.

## 🧠 Prompt to Codex
Agent-side logic
In the ProfileBuilder agent, after collecting the final field:

Send a webhook with message_type = "step_complete" or
Update Supabase (e.g. profile.step = 3 or can_review = true)
Ensure this logic only triggers once, after all 6 fields are present.

Frontend (profile-create.tsx or similar)
Watch for this state:
Webhook response with "step_complete" message type
OR polling Supabase field like step == 3 or can_review == true
When detected:
Switch to Step 3 view (e.g. via router.push() or internal state)
Optional: delay transition by ~500ms to show the final chat message
Step 3 UI — Table Layout
Display all collected profile fields in a basic table or card layout:
field name, value, edit button (optional)
Example fields: niche, audience_goal, monetization_goal...
Allow the user to:
Read each field’s value
Optionally click an edit icon or field to update the value inline or via modal
Add a primary button: “Generate Insight Report” at the bottom
Clicking this should assemble the full profile and POST /profile_analyzer
Design can be basic — focus on logic, layout, and clarity.


## 🧩 Related Files
- `agents/profilebuilder_agent.py`
- `pages/profile-create.tsx`
- `components/Step3ReviewTable.tsx` or similar
- `supabase_helpers.py` (if updating step flag)