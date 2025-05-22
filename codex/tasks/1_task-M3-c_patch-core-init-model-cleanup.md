## codex/tasks/1_task-M3-c_patch-core-init-model-cleanup.md

# Patch A — make core a package & deduplicate the double “tools” line

## Changes
```diff
+ api/src/core/__init__.py
* api/src/core/task_registry/models.py

*** ✨ core/__init__.py ***
"""Core middleware package (task registry, validators, etc.)."""

*** 🔧 models.py (remove duplicate tools line—keep the list[str] version) ***
@@
-    tools: List[str] = []
-    validator_schema: Optional[str] = None
+    tools: list[str] = []      # keep single definition (lower-case list OK on 3.9+)
+    validator_schema: Optional[str] = None
