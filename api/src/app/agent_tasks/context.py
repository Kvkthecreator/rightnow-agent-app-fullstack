"""
Module: agent_tasks.context

Provides utility to load full profile context (profile row + report sections)
for given user_id from Supabase.
"""

from ..util.supabase_helpers import supabase


def get_full_profile_context(user_id: str) -> dict:
    """
    Retrieves full profile context for the given user.

    Loads:
      - profiles row matching user_id
      - all profile_report_sections rows for that profile, ordered by order_index

    Returns:
        {
            "profile": dict,            # profile row or empty dict
            "report_sections": list,    # list of section dicts
        }
    """
    # Load the user profile
    profile: dict = {}
    try:
        res = supabase.table("profiles").select("*").eq("user_id", user_id).execute()
        data = res.data or []
        profile = data[0] if len(data) > 0 else {}
    except Exception as e:
        print(f"[Context] Error loading profile for user {user_id}: {e}")

    # Load report sections for the profile
    report_sections: list = []
    try:
        profile_id = profile.get("id")
        if profile_id:
            sec_res = (
                supabase.table("profile_report_sections")
                .select("*")
                .eq("profile_id", profile_id)
                .order("order_index", {"ascending": True})
                .execute()
            )
            report_sections = sec_res.data or []
    except Exception as e:
        print(
            f"[Context] Error loading report sections for profile {profile.get('id')}: {e}"
        )

    # Future: expand context with analytics, campaign history, etc.

    return {"profile": profile, "report_sections": report_sections}


# Sample return structure:
# {
#   "profile": { "id": "...", "display_name": "...", ... },
#   "report_sections": [ {"title": "...", "body": "...", "order_index": 0}, ... ]
# }
