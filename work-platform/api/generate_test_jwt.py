#!/usr/bin/env python3
"""
Generate a test JWT token for testing YARNNN API endpoints.

This creates a Supabase-compatible JWT token that can be used with the
work-platform API for testing purposes.

Usage:
    python generate_test_jwt.py

Environment Variables Required:
    SUPABASE_URL - Your Supabase project URL
    SUPABASE_JWT_SECRET - Your Supabase JWT secret
"""

import os
import sys
import jwt
from datetime import datetime, timedelta

def generate_test_jwt(
    user_email: str = "kvkthecreator@gmail.com",
    expiry_hours: int = 24
) -> str:
    """
    Generate a Supabase-compatible JWT token.

    Args:
        user_email: Email address of the user (used to look up user_id)
        expiry_hours: Token expiry in hours (default: 24)

    Returns:
        JWT token string
    """
    # Get environment variables
    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
    jwt_aud = os.getenv("SUPABASE_JWT_AUD", "authenticated")

    if not supabase_url:
        print("❌ ERROR: SUPABASE_URL environment variable not set")
        sys.exit(1)

    if not jwt_secret:
        print("❌ ERROR: SUPABASE_JWT_SECRET environment variable not set")
        sys.exit(1)

    # First, get the user_id from Supabase using email
    from app.utils.supabase_client import supabase_admin_client

    print(f"Looking up user ID for: {user_email}")

    try:
        # Query auth.users table
        response = supabase_admin_client.table("users").select("id").eq(
            "email", user_email
        ).limit(1).execute()

        if not response.data or len(response.data) == 0:
            print(f"❌ ERROR: No user found with email {user_email}")
            print("   Available options:")
            print("   1. Create user in Supabase dashboard")
            print("   2. Use a different email address")
            sys.exit(1)

        user_id = response.data[0]["id"]
        print(f"✅ Found user ID: {user_id}")

    except Exception as e:
        print(f"❌ ERROR querying Supabase: {e}")
        print("\nTrying alternative method (direct user_id)...")

        # Alternative: If we can't query, use a known user_id
        # This requires you to provide the user_id directly
        user_id = os.getenv("TEST_USER_ID")
        if not user_id:
            print("❌ Could not find user. Please set TEST_USER_ID environment variable")
            print("   You can find your user ID in Supabase Dashboard > Authentication > Users")
            sys.exit(1)
        print(f"✅ Using user ID from environment: {user_id}")

    # Create JWT payload
    now = datetime.utcnow()
    expiry = now + timedelta(hours=expiry_hours)

    payload = {
        "aud": jwt_aud,
        "exp": int(expiry.timestamp()),
        "iat": int(now.timestamp()),
        "iss": f"{supabase_url}/auth/v1",
        "sub": user_id,
        "email": user_email,
        "role": "authenticated",
        "session_id": "test-session-" + user_id[:8],
    }

    print(f"\nGenerating JWT token...")
    print(f"  User ID: {user_id}")
    print(f"  Email: {user_email}")
    print(f"  Issuer: {payload['iss']}")
    print(f"  Audience: {jwt_aud}")
    print(f"  Expires: {expiry.isoformat()}Z ({expiry_hours}h from now)")

    # Encode JWT
    token = jwt.encode(payload, jwt_secret, algorithm="HS256")

    print(f"\n✅ JWT Token Generated Successfully!\n")
    print("=" * 80)
    print(token)
    print("=" * 80)

    # Also save to file for easy copying
    token_file = "/tmp/yarnnn_test_jwt.txt"
    with open(token_file, "w") as f:
        f.write(token)

    print(f"\n💾 Token saved to: {token_file}")

    # Print example curl command
    print("\n📝 Example Usage:\n")
    print("export TEST_JWT_TOKEN=\"" + token + "\"")
    print("\ncurl -X POST https://yarnnn-work-platform-api.onrender.com/agents/run \\")
    print("  -H \"Authorization: Bearer $TEST_JWT_TOKEN\" \\")
    print("  -H \"Content-Type: application/json\" \\")
    print("  -d '{")
    print("    \"agent_type\": \"research\",")
    print("    \"task_type\": \"deep_dive\",")
    print("    \"basket_id\": \"YOUR_BASKET_ID\",")
    print("    \"parameters\": {")
    print("      \"topic\": \"Test: AI agent SDK patterns\"")
    print("    }")
    print("  }'")

    return token


def main():
    """Main entry point."""
    print("=" * 80)
    print("  YARNNN Test JWT Token Generator")
    print("=" * 80)
    print()

    # Get user email from environment or use default
    user_email = os.getenv("TEST_USER_EMAIL", "kvkthecreator@gmail.com")

    # Generate token
    token = generate_test_jwt(user_email=user_email)

    return 0


if __name__ == "__main__":
    sys.exit(main())
