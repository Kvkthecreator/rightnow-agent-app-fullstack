## codex/tasks/patch_requirements_txt_openaiimport.md

Great — since you're focused on testing web tools now, and not modifying the SDK itself, the cleanest and most reliable approach is:

✅ Recommendation: Install OpenAI Agents SDK Directly from GitHub

This ensures:

web_search_tool works out of the box
You avoid submodule path and editable install complexity
Deployment on Render is predictable and reproducible
🧠 Codex Task: Patch requirements.txt to Install Agents SDK from GitHub

Here’s a minimal and precise task for Codex:

📄 Task Title
Use GitHub source for openai-agents SDK to enable web_search_tool

🧠 Prompt to Codex
# 📍 File: api/requirements.txt

Replace the current openai-agents version line with a direct GitHub reference:

# Old (remove this)
openai-agents==0.0.14

# New (add this instead)
git+https://github.com/openai/openai-agents-python.git@main#egg=openai-agents

# Ensure openai is still listed (leave this as-is or bump version if needed)
openai>=1.66.5