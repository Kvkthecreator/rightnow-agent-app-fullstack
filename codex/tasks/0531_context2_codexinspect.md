## codex/tasks/0531_context2_codexinspect.md

We have refactored our app routes based on a new UX model:

Old pages:
- /task-brief → now /briefs
- /profile-create → now /blocks/setup
- /library → now /blocks

New routes exist at:
- /blocks
- /briefs/create
- /briefs/[briefId]
- /creations
- /creations/[outputId]
- /tasks
- /tasks/[taskId]

Please do the following:
1. Update any outdated route references in the app, especially in the sidebar nav, layout files, and `Link` or `href` usages.
2. Make sure the sidebar shows: Dashboard, Blocks, Briefs, Tasks, Creations (in this order).
3. Fix any relative links to use Next.js `<Link>` correctly.
4. Confirm dynamic route links are correct (e.g. /tasks/[taskId] → `/tasks/${task.id}`).
5. Ensure `/blocks/setup` is not shown in the nav, but is linked if the user has no blocks.

Don't modify anything else (styling, logic, etc.).
