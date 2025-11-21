"""
Diagnostic script to test Claude Agent SDK behavior with TP.

This will help identify if the SDK is hanging during receive_response().
"""
import asyncio
import os
import sys
import logging

# Set environment variables BEFORE imports (use actual env vars from your environment)
# os.environ['SUPABASE_URL'] = 'your-supabase-url'
# os.environ['SUPABASE_SERVICE_ROLE_KEY'] = 'your-service-role-key'
# os.environ['ANTHROPIC_API_KEY'] = 'your-api-key'
# os.environ['SUBSTRATE_API_URL'] = 'your-substrate-url'
# os.environ['SUBSTRATE_SERVICE_SECRET'] = 'your-secret'

# Or use dotenv to load from .env file
from dotenv import load_dotenv
load_dotenv()

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'work-platform/api/src'))

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_tp_chat():
    """Test TP chat with timeout to detect hanging."""
    from agents_sdk.thinking_partner_sdk import create_thinking_partner_sdk

    basket_id = "5004b9e1-67f5-4955-b028-389d45b1f5a4"
    workspace_id = "d35f88ad-c934-489f-a4e6-ac4bae1be3b6"  # You'll need to find this
    user_id = "f2fbbe59-b524-4d8f-b682-d09f3b8d9ca8"

    logger.info("Creating TP instance...")
    tp = create_thinking_partner_sdk(
        basket_id=basket_id,
        workspace_id=workspace_id,
        user_id=user_id
    )

    logger.info("Sending chat message with 30-second timeout...")
    try:
        # Add timeout to detect hanging
        result = await asyncio.wait_for(
            tp.chat(
                user_message="Hello, can you help me?",
                claude_session_id=None
            ),
            timeout=30.0  # 30 seconds
        )

        logger.info("✅ Chat completed successfully!")
        logger.info(f"Response: {result.get('message', '')[:200]}")
        logger.info(f"Session ID: {result.get('session_id')}")
        logger.info(f"Claude Session ID: {result.get('claude_session_id')}")
        logger.info(f"Actions: {result.get('actions_taken', [])}")

    except asyncio.TimeoutError:
        logger.error("❌ TIMEOUT: Chat hung for 30+ seconds!")
        logger.error("This confirms the SDK receive_response() loop is hanging")
        logger.error("Possible causes:")
        logger.error("  1. Claude SDK subprocess (Node.js) not completing")
        logger.error("  2. SDK waiting for more input from Claude API")
        logger.error("  3. Network timeout with Claude API")
        logger.error("  4. SDK session management issue")

    except Exception as e:
        logger.exception(f"❌ ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(test_tp_chat())
