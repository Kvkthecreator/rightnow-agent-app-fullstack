#!/usr/bin/env python3
"""
Create Service Integration Token for work-platform → substrate-API

This script creates an integration token that work-platform-API can use to authenticate
with substrate-API for service-to-service communication.

Usage:
    python create_service_integration_token.py

Requirements:
    - SUPABASE_URL environment variable
    - SUPABASE_SERVICE_ROLE_KEY environment variable
    - USER_ID environment variable (your Supabase user ID)
    - WORKSPACE_ID environment variable (your workspace ID)
"""

import os
import sys
import secrets
import hashlib
from datetime import datetime, timezone

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from app.utils.supabase import supabase_admin


def _hash_token(raw: str) -> str:
    """SHA256 hash for token storage."""
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def create_service_token():
    """Create integration token for service authentication."""

    # Get required config
    user_id = os.getenv("USER_ID")
    workspace_id = os.getenv("WORKSPACE_ID")

    if not user_id:
        print("❌ USER_ID environment variable not set")
        print("\nGet your user ID from Supabase auth.users table or frontend:")
        print("  SELECT id FROM auth.users WHERE email = 'your@email.com';")
        print("\nThen run:")
        print("  export USER_ID=<your-user-id>")
        return None

    if not workspace_id:
        print("❌ WORKSPACE_ID environment variable not set")
        print("\nGet your workspace ID from database:")
        print("  SELECT id FROM workspaces WHERE owner_user_id = '<your-user-id>';")
        print("\nThen run:")
        print("  export WORKSPACE_ID=<your-workspace-id>")
        return None

    # Generate token
    raw_token = "yit_" + secrets.token_urlsafe(32)
    token_hash = _hash_token(raw_token)

    print(f"📝 Creating integration token...")
    print(f"   User ID: {user_id}")
    print(f"   Workspace ID: {workspace_id}")

    # Insert into database
    sb = supabase_admin()
    try:
        insert_resp = sb.table("integration_tokens").insert({
            "token_hash": token_hash,
            "user_id": user_id,
            "workspace_id": workspace_id,
            "description": "work-platform → substrate-API service token (auto-generated)",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }).execute()

        if hasattr(insert_resp, 'error') and insert_resp.error:
            print(f"❌ Failed to create token: {insert_resp.error}")
            return None

        print("✅ Token created successfully!")
        print()
        print("=" * 80)
        print("INTEGRATION TOKEN (save this securely!):")
        print("=" * 80)
        print(raw_token)
        print("=" * 80)
        print()
        print("⚠️  IMPORTANT: This token will not be shown again!")
        print()
        print("📋 Next Steps:")
        print()
        print("1. Copy the token above")
        print()
        print("2. Update Render environment variable:")
        print("   - Go to: https://dashboard.render.com/web/yarnnn-work-platform-api")
        print("   - Environment tab")
        print("   - Update: SUBSTRATE_SERVICE_SECRET")
        print("   - Paste the token above")
        print("   - Save (triggers auto-deploy)")
        print()
        print("3. Verify authentication:")
        print("   - Check Render logs for: 'Substrate API ... 200 OK'")
        print("   - No more 401 errors")
        print("   - Circuit breaker stays closed")
        print()

        # Verify token can be retrieved
        verify_resp = sb.table("integration_tokens").select(
            "id, description, created_at"
        ).eq("token_hash", token_hash).maybe_single().execute()

        if verify_resp and verify_resp.data:
            record = verify_resp.data
            print("✅ Token verified in database:")
            print(f"   Token ID: {record['id']}")
            print(f"   Description: {record['description']}")
            print(f"   Created: {record['created_at']}")

        return raw_token

    except Exception as exc:
        print(f"❌ Error creating token: {exc}")
        return None


def list_existing_tokens():
    """List existing integration tokens for reference."""
    user_id = os.getenv("USER_ID")
    workspace_id = os.getenv("WORKSPACE_ID")

    if not workspace_id:
        return

    print("\n📋 Existing integration tokens for this workspace:")
    print("-" * 80)

    sb = supabase_admin()
    try:
        resp = sb.table("integration_tokens").select(
            "id, description, created_at, last_used_at, revoked_at"
        ).eq("workspace_id", workspace_id).order("created_at", desc=True).execute()

        if not resp.data:
            print("   (none)")
            return

        for token in resp.data:
            status = "REVOKED" if token.get("revoked_at") else "ACTIVE"
            last_used = token.get("last_used_at") or "never"
            print(f"   [{status}] {token['description']}")
            print(f"            ID: {token['id']}")
            print(f"            Created: {token['created_at']}")
            print(f"            Last used: {last_used}")
            print()

    except Exception as exc:
        print(f"   Error listing tokens: {exc}")


def main():
    """Main entry point."""
    print()
    print("=" * 80)
    print("Create Service Integration Token for work-platform → substrate-API")
    print("=" * 80)
    print()

    # Check Supabase config
    if not os.getenv("SUPABASE_URL"):
        print("❌ SUPABASE_URL environment variable not set")
        return 1

    if not os.getenv("SUPABASE_SERVICE_ROLE_KEY"):
        print("❌ SUPABASE_SERVICE_ROLE_KEY environment variable not set")
        return 1

    # List existing tokens first
    list_existing_tokens()

    # Create new token
    token = create_service_token()

    if not token:
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
