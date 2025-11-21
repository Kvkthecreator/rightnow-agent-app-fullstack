"""Quick check of TP sessions in production database"""
import asyncio
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'work-platform/api/src'))

async def check_sessions():
    # Load environment variables from .env file
    from dotenv import load_dotenv
    load_dotenv()

    from app.utils.supabase import supabase_admin

    supabase = supabase_admin()
    
    basket_id = "5004b9e1-67f5-4955-b028-389d45b1f5a4"  # From your URL
    
    print(f"Checking sessions for basket: {basket_id}\n")
    
    # Get all sessions for this basket
    result = supabase.table("agent_sessions").select("*").eq(
        "basket_id", basket_id
    ).execute()
    
    print(f"Found {len(result.data)} sessions:")
    for session in result.data:
        print(f"\nSession: {session['id'][:8]}...")
        print(f"  Type: {session['agent_type']}")
        print(f"  Parent: {session.get('parent_session_id', 'NULL')}")
        print(f"  SDK Session: {session.get('sdk_session_id', 'None')[:20] if session.get('sdk_session_id') else 'None'}...")
        print(f"  Created: {session['created_at']}")

asyncio.run(check_sessions())
