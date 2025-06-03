#api/src/app/agent_tasks/orchestration/rules/block_crud_rules.py
#Later you can load this from DB, but a Python dict is fine for v 0.1.

"""
Declarative rules the block-manager uses to decide
whether to auto-create/update/delete or require approval.
"""

BLOCK_CRUD_RULES = {
    "tone": {
        "allow_auto_create": True,
        "allow_auto_update": True,
        "allow_auto_delete": False,
        "requires_approval": True,
    },
    "campaign_goal": {
        "allow_auto_create": False,
        "allow_auto_update": False,
        "allow_auto_delete": False,
        "requires_approval": True,
    },
    # default fallback
    "*": {
        "allow_auto_create": True,
        "allow_auto_update": True,
        "allow_auto_delete": False,
        "requires_approval": False,
    },
}
