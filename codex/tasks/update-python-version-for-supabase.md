## codex/tasks/update-python-version-for-supabase.md

codex/task: update-python-version-for-supabase.md

Title
Restrict Python version to <4.0 in api/pyproject.toml for Supabase compatibility

Background
Supabase requires Python 3.9, 3.10, 3.11, or 3.12—but not Python 3.13 or 4.x.
Local installs currently fail due to Python 3.13 incompatibility, but Render builds are fine because it uses a lower Python version.

Task Steps
Open api/pyproject.toml.
Locate the [tool.poetry.dependencies] section.
Add or update the Python requirement (if it exists, replace the line) so it looks exactly like this:
python = ">=3.9,<4.0"
If there’s already a python = ... line, just change it to the above.
Save the file.
(Optional, but recommended)
In your terminal, in the api/ directory, run:
poetry env use 3.11
poetry install --no-root
This will ensure your local Poetry virtualenv uses Python 3.11 and all dependencies match your production (Render) environment.
Test:
Try running:
poetry run uvicorn src.app.agent_server:app --reload --host 0.0.0.0 --port 10000
Confirm there are no Supabase errors.
Commit and push the change:
git add api/pyproject.toml
git commit -m "Restrict api Python version to <4.0 for Supabase compatibility"
git push
(Optional)
Deploy to Render as normal and verify that builds still succeed.
Notes
This will not break Render or any other environments using 3.9–3.12.
No app logic, code, or API endpoints are touched—only the Python version restriction.
