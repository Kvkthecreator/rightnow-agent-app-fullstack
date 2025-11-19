#!/usr/bin/env python3
"""
Simple JWT token generator for testing.

Generates a Supabase-compatible JWT without needing database access.
You just need to provide your user_id (UUID from Supabase).

Usage:
    # Set environment variables
    export SUPABASE_URL="your-supabase-url"
    export SUPABASE_JWT_SECRET="your-jwt-secret"
    export TEST_USER_ID="your-user-uuid"  # Optional, will prompt if not set

    # Run script
    python generate_jwt_simple.py

    # Or provide user_id as argument
    python generate_jwt_simple.py YOUR_USER_UUID
"""

import os
import sys
import jwt
from datetime import datetime, timedelta

def generate_jwt_token(user_id: str, expiry_hours: int = 24) -> str:
    """
    Generate a Supabase-compatible JWT token.

    Args:
        user_id: Supabase user UUID
        expiry_hours: Token expiry in hours

    Returns:
        JWT token string
    """
    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
    jwt_aud = os.getenv("SUPABASE_JWT_AUD", "authenticated")

    if not supabase_url:
        raise ValueError("SUPABASE_URL environment variable not set")

    if not jwt_secret:
        raise ValueError("SUPABASE_JWT_SECRET environment variable not set")

    # Create JWT payload (Supabase format)
    now = datetime.utcnow()
    expiry = now + timedelta(hours=expiry_hours)

    payload = {
        "aud": jwt_aud,
        "exp": int(expiry.timestamp()),
        "iat": int(now.timestamp()),
        "iss": f"{supabase_url}/auth/v1",
        "sub": user_id,
        "email": "kvkthecreator@gmail.com",  # Your email
        "role": "authenticated",
        "session_id": f"test-session-{user_id[:8]}",
    }

    # Encode JWT
    token = jwt.encode(payload, jwt_secret, algorithm="HS256")

    return token, payload


def main():
    """Main entry point."""
    print("\n" + "=" * 80)
    print("  YARNNN Test JWT Generator (Simple)")
    print("=" * 80 + "\n")

    # Get user_id
    user_id = None

    # Try command line argument first
    if len(sys.argv) > 1:
        user_id = sys.argv[1]
        print(f"Using user_id from command line: {user_id}")

    # Try environment variable
    if not user_id:
        user_id = os.getenv("TEST_USER_ID")
        if user_id:
            print(f"Using user_id from TEST_USER_ID: {user_id}")

    # Prompt user
    if not user_id:
        print("To find your user_id:")
        print("  1. Go to Supabase Dashboard > Authentication > Users")
        print("  2. Find your email (kvkthecreator@gmail.com)")
        print("  3. Copy the UUID in the 'ID' column")
        print()
        user_id = input("Enter your Supabase user_id (UUID): ").strip()

    if not user_id:
        print("\n❌ ERROR: user_id is required")
        return 1

    # Validate UUID format (basic check)
    if len(user_id) != 36 or user_id.count("-") != 4:
        print(f"\n⚠️  WARNING: '{user_id}' doesn't look like a UUID")
        print("   Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")
        proceed = input("   Continue anyway? (y/n): ").strip().lower()
        if proceed != "y":
            return 1

    try:
        # Generate token
        print(f"\nGenerating JWT token...")
        token, payload = generate_jwt_token(user_id)

        print(f"\n✅ JWT Token Generated Successfully!\n")
        print("Token Details:")
        print(f"  User ID: {payload['sub']}")
        print(f"  Email: {payload['email']}")
        print(f"  Expires: {datetime.fromtimestamp(payload['exp']).isoformat()}Z")
        print(f"  Valid for: 24 hours")

        print("\n" + "=" * 80)
        print(token)
        print("=" * 80)

        # Save to file
        token_file = "/tmp/yarnnn_test_jwt.txt"
        with open(token_file, "w") as f:
            f.write(token)

        print(f"\n💾 Token saved to: {token_file}")

        # Save to environment variable export
        env_file = "/tmp/yarnnn_test_jwt_env.sh"
        with open(env_file, "w") as f:
            f.write(f'export TEST_JWT_TOKEN="{token}"\n')
            f.write(f'export TEST_USER_ID="{user_id}"\n')

        print(f"💾 Environment variables saved to: {env_file}")
        print(f"\n   To use in terminal:")
        print(f"   source {env_file}")

        # Example usage
        print("\n📝 Example API Test:\n")
        print(f"export TEST_JWT_TOKEN=\"{token}\"")
        print("\ncurl -X POST https://yarnnn-work-platform-api.onrender.com/agents/run \\")
        print("  -H \"Authorization: Bearer $TEST_JWT_TOKEN\" \\")
        print("  -H \"Content-Type: application/json\" \\")
        print("  -d '{")
        print("    \"agent_type\": \"research\",")
        print("    \"task_type\": \"deep_dive\",")
        print("    \"basket_id\": \"YOUR_BASKET_ID\",")
        print("    \"parameters\": {\"topic\": \"AI agent SDK patterns\"}")
        print("  }'\n")

        return 0

    except ValueError as e:
        print(f"\n❌ ERROR: {e}")
        print("\nMake sure you have set:")
        print("  export SUPABASE_URL='your-supabase-url'")
        print("  export SUPABASE_JWT_SECRET='your-jwt-secret'")
        return 1

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
