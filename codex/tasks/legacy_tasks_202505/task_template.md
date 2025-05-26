# 🧠 Codex Task Template

## 📄 Task Title
_Example: Refactor ProfileBuilder Agent_

## 🎯 Goal
Clearly describe what this improvement or task should accomplish.
- What needs to be changed?
- What problem does this solve?
- What file(s) or folder(s) are involved?

## 🧠 Prompt to Codex
```
Write your full prompt to Codex here, as if you're asking a smart assistant to do the work.
Include specifics like function names, structure expectations, or anti-patterns to avoid.

Also:
- Log reasoning, iterations, and accepted/rejected decisions into `codex/sessions/<task-name>-session.md`
- If multiple versions or drafts are relevant, save them in `codex/drafts/<descriptive-name>.tsx`
- Use the task file name `codex/tasks/<task-name>.md` as reference context
```

## 🗂 Context
List any file names, locations, or functions this task is related to.

- File(s): `src/agents/profilebuilder_agent.py`
- Related concepts: webhook payload, section modularity

## 🛠 Status
- [ ] Not started
- [ ] In progress
- [ ] Reviewed
- [ ] Merged

## 🔗 Related Branch
Create a Git branch using a matching name:
```
git checkout -b refactor-profilebuilder-agent
```

## 📥 Codex Output Summary (optional)
Paste Codex’s responses, variations, and decisions here.

---
> To create a new task, copy this file:
> `cp task_template.md refactor-profilebuilder-agent.md`

### 🔁 Codex Instructions – Project Conventions

- **Import statements should never include `.tsx` or `.ts` extensions**.
  - ✅ `import Header from '../components/Header'`
  - ❌ `import Header from '../components/Header.tsx'`
  - Reason: This breaks builds on Vercel and most production Linux environments unless `allowImportingTsExtensions` is set (which we don't use).
