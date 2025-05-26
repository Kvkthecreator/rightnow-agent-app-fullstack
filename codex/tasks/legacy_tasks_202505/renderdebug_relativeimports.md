## codex/tasks/renderdebug_relativeimports.md

🧠 Codex Task: Convert Intra-App Imports to Relative Imports

📄 Task Title
Refactor intra-app imports in api/src/app/ to use relative imports

🎯 Goal
Ensure all Python files under api/src/app/ use dot-relative imports (from .module import ...) when importing other modules from within the same app package.
This will resolve the ModuleNotFoundError: No module named 'app' issue in deployment.

🧠 Prompt to Codex
Scan all `.py` files inside `api/src/app/`.

**For every import statement that looks like:**
    from app.<module> import <something>
    from app.<submodule>.<module> import <something>

**Change to:**
    from .<module> import <something>
    from .<submodule>.<module> import <something>

- Only change imports that reference the same `app` package (do not modify third-party imports or relative imports already present).
- Do **not** change import statements in files outside of `api/src/app/`.
- If a file imports multiple modules from `app`, convert each one accordingly.
- Preserve formatting, docstrings, and comments elsewhere in each file.
- After refactor, print a list of files that were changed for my review.
