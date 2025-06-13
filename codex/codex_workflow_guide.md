# 🤖 Codex Development Workflow Guide

This document defines the structured way of working with the Codex CLI and Git to drive modular improvements in this project. It ensures changes are scoped, testable, and documented, while keeping the main branch stable.

---

## 📌 Purpose
To use OpenAI's Codex CLI for targeted, trackable development tasks in a safe and repeatable way, pairing each task with its own Git branch.

---

## 🧱 Folder Overview
- `codex/tasks/`: One `.md` file per scoped Codex prompt or task
- `codex/drafts/`: Codex-generated rough code, scratch files
- `codex/sessions/`: Logs or transcripts of CLI conversations
- `codex/usage.md`: Codex CLI reference and tips
- `codex/codex_workflow_guide.md`: (this file)

---

## 🔁 Workflow Summary

### 1. **Create a New Task File**
```bash
cd codex/tasks
cp task_template.md add-clarification-endpoint.md
```

### 2. **Write the Task Prompt**
In the `.md` file:
- Define a clear goal
- Add a Codex-ready prompt in triple backticks
- List file context, references, or known issues

### 3. **Create a Paired Git Branch**
```bash
git checkout -b add-clarification-endpoint
```

### 4. **Run Codex CLI and Apply Changes**
```bash
codex
> Refactor the following agent to support a new Clarification step...
```
- Apply suggestions manually or let Codex edit with approval
- Save any generated ideas or alternates in `/codex/drafts`

### 5. **Test Locally**
- Run `npm run dev` or `uvicorn` as needed
- Always use the Makefile to run backend tests:
```bash
make test  # sets PYTHONPATH correctly for /api tests
```
- Ensure frontend ↔ backend calls still succeed

### 6. **Commit and Push**
```bash
git add .
git commit -m "[agent] Add clarification endpoint logic"
git push origin add-clarification-endpoint
```

### 7. **Merge to `main` When Stable**
```bash
git checkout main
git merge add-clarification-endpoint
git push origin main
```

---

## ✅ Git Branch Naming Suggestions
| Task Prefix  | Example                    |
|--------------|-----------------------------|
| `add/`       | `add-missing-fallbacks`     |
| `refactor/`  | `refactor-agent-session`    |
| `fix/`       | `fix-webhook-disconnect`    |
| `docs/`      | `docs-codex-guide`          |

---

## 💡 Tips
- Codex works best with clear goals and small surface area
- Track all task intentions in `codex/tasks/`, even if incomplete
- Push branches early and often — keep `main` stable

---

This approach scales with your confidence. Let Codex be your silent partner — you’re the lead engineer.
