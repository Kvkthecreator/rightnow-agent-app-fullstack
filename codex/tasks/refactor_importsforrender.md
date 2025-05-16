## codex/tasks/refactor_importsforrender.md

Codex Task Request

Goal: Refactor all internal import statements within /api/src/app/ to use relative imports.
Any import from another file in src/app/ should be from .filename import thing.
Ensure all subdirectories have an __init__.py file.
Update ONLY the imports (not logic or function names).
Confirm that uvicorn src.app.agent_server:app ... will work with these imports.
Do NOT reference openai.tools.web_search (that module does not exist in the standard OpenAI Python package).
Ensure all import paths work for both local dev and Render deploy (with /api as the root).
Output a list of all files changed and their new import lines for quick review before I commit.
