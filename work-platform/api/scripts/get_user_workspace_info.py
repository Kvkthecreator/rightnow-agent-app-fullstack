#!/usr/bin/env python3
"""
Get User and Workspace Info for Integration Token Creation

This script helps you find your user_id and workspace_id needed for creating integration tokens.

Usage:
    python get_user_workspace_info.py
"""

import os
import sys

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from app.utils.supabase import supabase_admin


def get_user_info():
    """Get user information from database."""
    sb = supabase_admin()

    print("\n📋 Finding users in database...")
    print("-" * 80)

    try:
        # Get users (limit to recent 5)
        resp = sb.table("auth.users").select(
            "id, email, created_at"
        ).order("created_at", desc=True).limit(5).execute()

        if not resp or not resp.data:
            print("   No users found in auth.users table")
            print("\n   Note: This query requires database access to auth schema.")
            print("   If this fails, check Supabase RLS policies or use service role key.")
            return None

        print("\nRecent users:")
        for user in resp.data:
            print(f"   Email: {user['email']}")
            print(f"   ID: {user['id']}")
            print(f"   Created: {user['created_at']}")
            print()

        return resp.data

    except Exception as exc:
        print(f"   Error querying users: {exc}")
        print("\n   Trying alternative query via public.profiles...")

        # Try via profiles table (if it exists)
        try:
            resp = sb.table("profiles").select(
                "user_id, email, created_at"
            ).order("created_at", desc=True).limit(5).execute()

            if resp and resp.data:
                print("\nRecent users (via profiles):")
                for profile in resp.data:
                    print(f"   Email: {profile.get('email', 'N/A')}")
                    print(f"   User ID: {profile['user_id']}")
                    print(f"   Created: {profile['created_at']}")
                    print()
                return resp.data
        except Exception as profile_exc:
            print(f"   Error: {profile_exc}")

        return None


def get_workspace_info(user_id=None):
    """Get workspace information from database."""
    sb = supabase_admin()

    print("\n📋 Finding workspaces in database...")
    print("-" * 80)

    try:
        query = sb.table("workspaces").select("id, name, owner_user_id, created_at")

        if user_id:
            query = query.eq("owner_user_id", user_id)

        resp = query.order("created_at", desc=True).limit(10).execute()

        if not resp or not resp.data:
            print("   No workspaces found")
            return None

        print("\nWorkspaces:")
        for workspace in resp.data:
            print(f"   Name: {workspace.get('name', 'N/A')}")
            print(f"   ID: {workspace['id']}")
            print(f"   Owner: {workspace['owner_user_id']}")
            print(f"   Created: {workspace['created_at']}")
            print()

        return resp.data

    except Exception as exc:
        print(f"   Error querying workspaces: {exc}")
        return None


def main():
    """Main entry point."""
    print()
    print("=" * 80)
    print("Get User and Workspace Info for Integration Token Creation")
    print("=" * 80)

    # Check Supabase config
    if not os.getenv("SUPABASE_URL"):
        print("\n❌ SUPABASE_URL environment variable not set")
        print("\nSet it with:")
        print("  export SUPABASE_URL=https://galytxxkrbksilekmhcw.supabase.co")
        return 1

    if not os.getenv("SUPABASE_SERVICE_ROLE_KEY"):
        print("\n❌ SUPABASE_SERVICE_ROLE_KEY environment variable not set")
        print("\nSet it with:")
        print("  export SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>")
        return 1

    # Get user info
    users = get_user_info()

    # Get workspace info
    user_id = None
    if users and len(users) > 0:
        # Use first user's ID for workspace query
        user_id = users[0].get('id') or users[0].get('user_id')

    workspaces = get_workspace_info(user_id)

    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)

    if users and workspaces:
        print("\n✅ Found user and workspace info!")
        print("\nTo create integration token, run:")
        print()

        # Use first user and first workspace
        first_user_id = users[0].get('id') or users[0].get('user_id')
        first_workspace_id = workspaces[0]['id']

        print(f"  export USER_ID={first_user_id}")
        print(f"  export WORKSPACE_ID={first_workspace_id}")
        print("  python scripts/create_service_integration_token.py")
        print()
    else:
        print("\n⚠️  Could not retrieve user or workspace info")
        print("\nManual steps:")
        print("1. Get user ID from Supabase dashboard → Authentication → Users")
        print("2. Get workspace ID from database:")
        print("   SELECT id FROM workspaces WHERE owner_user_id = '<your-user-id>';")
        print()

    return 0


if __name__ == "__main__":
    sys.exit(main())
