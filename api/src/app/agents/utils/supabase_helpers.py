"""
Legacy supabase helpers - kept for backward compatibility with agent_entrypoints.py
TODO: Migrate to canonical queue processor architecture
"""
import uuid
from typing import Optional
from supabase import create_client, Client
import os

# Legacy supabase client - TODO: use canonical queue processor instead
supabase: Client = create_client(
    os.environ["SUPABASE_URL"], 
    os.environ["SUPABASE_SERVICE_ROLE_KEY"]
)

def create_task_and_session(user_id: str, agent_name: str) -> str:
    """
    Legacy function to create task and session
    TODO: Replace with canonical queue processing
    """
    task_id = str(uuid.uuid4())
    
    # Stub implementation - just return a task ID
    # The canonical agent system handles task processing differently
    return task_id