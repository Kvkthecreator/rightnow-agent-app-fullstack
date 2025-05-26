## codex/tasks/render_build_debug.md

## 📄 Task Title
Fix OpenAI Agent Tool Import by Installing Correct GitHub Version

## 🎯 Goal
Ensure the correct version of `openai-agents` is installed from GitHub (not PyPI) so that `web_search_tool` can be imported inside `profile_analyzer_agent.py`. This fixes the current Render deployment error:  
`ImportError: cannot import name 'web_search_tool' from 'openai'`.

## 🧠 Prompt to Codex

Please update the `requirements.txt` file located at `api/src/requirements.txt` to install the `openai-agents` package directly from the GitHub source.

Steps:
1. Add the following line to the top of the file:
-e git+https://github.com/openai/openai-agents-python.git@main#egg=openai-agents


2. Ensure the `openai` dependency is still present, e.g.:
openai>=1.66.5


3. Commit this change.

This change will ensure that during `pip install`, the correct GitHub version of the SDK is installed, including support for tools like `web_search_tool`.

You do not need to modify any Python files. Just make this requirements change and commit it.

## 📁 Files Affected
- `api/src/requirements.txt`