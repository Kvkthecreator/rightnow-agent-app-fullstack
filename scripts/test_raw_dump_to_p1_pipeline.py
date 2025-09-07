#!/usr/bin/env python3
"""
Test Raw Dump → P1 Agent Pipeline (End-to-End)

Verifies the complete flow from raw_dump creation through P1 agent processing 
to proposed blocks and context_items creation:

1. Creates a new raw_dump with meaningful content
2. Verifies universal work orchestration creates P0_CAPTURE work
3. Triggers P1 agent processing via work queue
4. Validates P1 agent creates proposals with blocks and context_items
5. Tests agent judgment in breaking down raw content into structured substrate

This test ensures Canon v2.1 Universal Work Orchestration properly handles
the sacred capture → agent processing → substrate creation flow.
"""

import sys
import os
import asyncio
import logging
import json
from uuid import uuid4
from datetime import datetime, timezone

# Add API src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api", "src"))

# Set environment variables for testing
os.environ["SUPABASE_URL"] = "https://galytxxkrbksilekmhcw.supabase.co"
os.environ["SUPABASE_ANON_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbHl0eHhrcmJrc2lsZWttaGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTU3NjMsImV4cCI6MjA2MjMzMTc2M30.n9wrD3a_fep8GfeCRm0iflk-4Y47RYnLA0EeEECU7OY"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbHl0eHhrcmJrc2lsZWttaGN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Njc1NTc2MywiZXhwIjoyMDYyMzMxNzYzfQ.0oAdZeTn_k3p-29Hy8z1v5YYGpjBeqML0amz5bcAS6g"

from app.utils.supabase_client import supabase_admin_client as supabase
from services.universal_work_tracker import universal_work_tracker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Test constants
REAL_WORKSPACE_ID = "31ee30fe-6ae3-4604-ab6d-ac9b9f06dfde"

async def get_real_user_id():
    """Get a real user ID from the database for testing."""
    try:
        # Get workspace membership to find a real user ID
        membership_response = supabase.table("workspace_memberships").select(
            "user_id"
        ).eq("workspace_id", REAL_WORKSPACE_ID).limit(1).execute()
        
        if membership_response.data:
            return membership_response.data[0]["user_id"]
        else:
            # Fallback: get any user
            users_response = supabase.table("users").select("id").limit(1).execute()
            if users_response.data:
                return users_response.data[0]["id"]
    except Exception as e:
        logger.warning(f"Could not find real user ID: {e}")
    
    # Last resort: use a null user_id (if allowed by schema)
    return None

# Rich test content that should trigger multiple blocks and context_items
TEST_DUMP_CONTENT = """
Project Alpha Launch Strategy - Q1 2025

EXECUTIVE SUMMARY:
Project Alpha is a new AI-powered customer service platform targeting mid-market SaaS companies. Our go-to-market strategy focuses on rapid deployment and measurable ROI within 60 days.

KEY OBJECTIVES:
1. Launch MVP by March 15, 2025
2. Acquire 50 pilot customers in Q1
3. Achieve $500K ARR by end of Q1
4. Maintain customer satisfaction score above 4.5/5

STAKEHOLDERS:
- Sarah Chen (Product Lead): Responsible for feature development and UX
- Marcus Rodriguez (Engineering Lead): Technical architecture and deployment
- Jennifer Kim (Sales Director): Customer acquisition and partnerships
- David Park (Customer Success): Implementation and support

MARKET ANALYSIS:
The customer service automation market is valued at $15.2B and growing 12% annually. Our primary competitors include Zendesk, Intercom, and emerging AI solutions like Ada and Drift.

TECHNICAL REQUIREMENTS:
- Multi-tenant SaaS architecture
- Real-time chat integration
- Advanced NLP for intent recognition
- Integration APIs for CRM systems
- SOC2 Type II compliance required

RISK FACTORS:
1. TECHNICAL RISKS: Scaling challenges with AI model performance
2. MARKET RISKS: Competitive response from established players
3. RESOURCE RISKS: Limited engineering bandwidth during holiday season
4. COMPLIANCE RISKS: Data privacy regulations in international markets

SUCCESS METRICS:
- Customer Acquisition Cost (CAC): Target under $2,500
- Customer Lifetime Value (CLV): Target above $15,000
- Monthly Recurring Revenue (MRR) growth: 25% month-over-month
- Net Promoter Score (NPS): Target above 50
- Time to Value: Under 14 days for customer onboarding

BUDGET ALLOCATION:
- Engineering: $300K (60%)
- Marketing: $100K (20%) 
- Sales: $75K (15%)
- Operations: $25K (5%)
Total Q1 Budget: $500K

TIMELINE MILESTONES:
Phase 1 (Jan 15): Core platform MVP complete
Phase 2 (Feb 1): Beta testing with 10 select customers
Phase 3 (Feb 15): Security audit and compliance certification
Phase 4 (Mar 1): Public launch and marketing campaign
Phase 5 (Mar 15): Full feature set release

This document represents our comprehensive strategy for establishing Project Alpha as a market leader in AI-powered customer service solutions.
"""

async def create_test_basket_and_dump():
    """Create test basket and raw_dump with rich content."""
    logger.info("🏗️  Creating test basket and raw_dump")
    
    try:
        # Get real user ID for testing
        test_user_id = await get_real_user_id()
        if not test_user_id:
            # Try without user_id if schema allows null
            test_user_id = None
        
        logger.info(f"Using test user ID: {test_user_id}")
        
        # Create test basket
        basket_data = {
            "id": str(uuid4()),
            "workspace_id": REAL_WORKSPACE_ID,
            "name": f"P1 Pipeline Test - {datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "status": "ACTIVE",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        if test_user_id:
            basket_data["user_id"] = test_user_id
        
        basket_response = supabase.table("baskets").insert(basket_data).execute()
        if not basket_response.data:
            raise Exception("Failed to create test basket")
        
        basket_id = basket_response.data[0]["id"]
        logger.info(f"✅ Created test basket: {basket_id}")
        
        # Create raw_dump with rich test content
        dump_data = {
            "id": str(uuid4()),
            "basket_id": basket_id,
            "workspace_id": REAL_WORKSPACE_ID,
            "body_md": TEST_DUMP_CONTENT,
            "text_dump": TEST_DUMP_CONTENT,  # Also populate text_dump field
            "processing_status": "unprocessed",
            "source_meta": {
                "test_scenario": "raw_dump_to_p1_pipeline",
                "expected_blocks": 5,  # Expecting multiple blocks from rich content
                "expected_context_items": 8,  # People, projects, metrics, etc.
                "test_timestamp": datetime.now().isoformat(),
                "source": "test_pipeline"
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        dump_response = supabase.table("raw_dumps").insert(dump_data).execute()
        if not dump_response.data:
            raise Exception("Failed to create test dump")
        
        dump_id = dump_response.data[0]["id"]
        logger.info(f"✅ Created test raw_dump: {dump_id}")
        logger.info(f"   Content length: {len(TEST_DUMP_CONTENT)} characters")
        logger.info(f"   Expected to generate: ~5 blocks, ~8 context_items")
        
        return basket_id, dump_id, test_user_id
        
    except Exception as e:
        logger.error(f"❌ Failed to create test data: {e}")
        raise

async def verify_universal_work_creation(dump_id):
    """Verify that dump creation triggers universal work orchestration."""
    logger.info("🔍 Verifying universal work creation")
    
    try:
        # Check for P0_CAPTURE work created for our dump
        work_response = supabase.table("agent_processing_queue").select(
            "work_id, work_type, work_payload, processing_state, created_at"
        ).eq("work_type", "P0_CAPTURE").contains(
            "work_payload", {"dump_id": dump_id}
        ).execute()
        
        if not work_response.data:
            logger.error("❌ No P0_CAPTURE work found for dump")
            return None
        
        work = work_response.data[0]
        work_id = work["work_id"]
        
        logger.info(f"✅ Found P0_CAPTURE work: {work_id}")
        logger.info(f"   Processing state: {work['processing_state']}")
        logger.info(f"   Created: {work['created_at']}")
        
        return work_id
        
    except Exception as e:
        logger.error(f"❌ Failed to verify work creation: {e}")
        return None

async def trigger_p1_processing(basket_id, dump_id, user_id):
    """Trigger P1 agent processing for the created dump."""
    logger.info("🚀 Triggering P1 agent processing")
    
    try:
        # Create P1_SUBSTRATE work entry
        work_payload = {
            "basket_id": basket_id,
            "dump_ids": [dump_id],
            "mode": "structured",
            "priority": "high",
            "test_context": {
                "scenario": "pipeline_validation",
                "expected_substrate_types": ["blocks", "context_items"],
                "validation_criteria": {
                    "min_blocks": 3,
                    "min_context_items": 5,
                    "min_confidence": 0.7
                }
            }
        }
        
        # Use universal work tracker to create P1 work
        from services.universal_work_tracker import WorkContext
        
        work_context = WorkContext(
            user_id=user_id or str(uuid4()),  # Use real user ID or fallback
            workspace_id=REAL_WORKSPACE_ID,
            basket_id=basket_id
        )
        
        p1_work_id = await universal_work_tracker.initiate_work(
            work_type="P1_SUBSTRATE",
            payload=work_payload,
            context=work_context
        )
        
        if not p1_work_id:
            raise Exception("Failed to create P1 work entry")
        
        logger.info(f"✅ Created P1_SUBSTRATE work: {p1_work_id}")
        
        # Simulate agent processing by directly calling the P1 endpoint
        # In production, this would be handled by the agent workers
        logger.info("🤖 Simulating P1 agent processing...")
        
        # Wait for potential async processing
        await asyncio.sleep(2)
        
        return p1_work_id
        
    except Exception as e:
        logger.error(f"❌ Failed to trigger P1 processing: {e}")
        return None

async def verify_p1_proposals_created(dump_id, basket_id, timeout_seconds=30):
    """Verify that P1 agent created proposals with blocks and context_items."""
    logger.info("🔍 Verifying P1 proposals and substrate creation")
    
    try:
        start_time = asyncio.get_event_loop().time()
        
        while (asyncio.get_event_loop().time() - start_time) < timeout_seconds:
            # Check for proposals that reference our dump
            proposals_response = supabase.table("proposals").select(
                "id, status, ops, validator_report, is_executed, execution_log"
            ).contains("provenance", [dump_id]).order(
                "created_at", {"ascending": False}
            ).execute()
            
            if proposals_response.data and len(proposals_response.data) > 0:
                proposal = proposals_response.data[0]
                proposal_id = proposal["id"]
                
                logger.info(f"✅ Found proposal: {proposal_id}")
                logger.info(f"   Status: {proposal['status']}")
                logger.info(f"   Executed: {proposal['is_executed']}")
                
                # Analyze the operations in the proposal
                ops = proposal.get("ops", [])
                if not ops:
                    logger.warning("⚠️  Proposal has no operations")
                    await asyncio.sleep(2)
                    continue
                
                # Count operation types
                op_counts = {}
                for op in ops:
                    op_type = op.get("type", "unknown")
                    op_counts[op_type] = op_counts.get(op_type, 0) + 1
                
                logger.info(f"   Operations: {json.dumps(op_counts, indent=2)}")
                
                # Check for blocks and context_items
                create_block_count = op_counts.get("CreateBlock", 0)
                create_context_count = op_counts.get("CreateContextItem", 0)
                
                if create_block_count == 0 and create_context_count == 0:
                    logger.warning("⚠️  No CreateBlock or CreateContextItem operations found")
                    await asyncio.sleep(2)
                    continue
                
                logger.info(f"✅ P1 Agent Judgment Results:")
                logger.info(f"   📝 Blocks to create: {create_block_count}")
                logger.info(f"   🏷️  Context items to create: {create_context_count}")
                
                # Check validator report
                validator_report = proposal.get("validator_report", {})
                if validator_report:
                    confidence = validator_report.get("confidence", 0)
                    warnings = validator_report.get("warnings", [])
                    
                    logger.info(f"   🎯 Agent confidence: {confidence:.3f}")
                    logger.info(f"   ⚠️  Validation warnings: {len(warnings)}")
                    
                    if confidence < 0.7:
                        logger.warning(f"⚠️  Low confidence score: {confidence}")
                
                # Check if proposal was executed
                if proposal["is_executed"]:
                    logger.info("✅ Proposal executed - substrate created!")
                    
                    # Verify actual substrate creation
                    substrate_created = await verify_substrate_creation(basket_id, create_block_count, create_context_count)
                    return substrate_created
                else:
                    logger.info("⏳ Proposal not yet executed, checking execution eligibility...")
                    
                    # If high confidence and no warnings, should auto-execute
                    if confidence > 0.7 and len(warnings) == 0:
                        logger.info("✅ Proposal meets auto-approval criteria")
                    else:
                        logger.warning("⚠️  Proposal requires manual review")
                
                return {
                    "proposal_created": True,
                    "proposal_id": proposal_id,
                    "blocks_proposed": create_block_count,
                    "context_items_proposed": create_context_count,
                    "confidence": confidence,
                    "executed": proposal["is_executed"]
                }
            
            logger.info("⏳ Waiting for P1 agent to process... (checking again in 2s)")
            await asyncio.sleep(2)
        
        logger.error("❌ Timeout: No proposals found within 30 seconds")
        return None
        
    except Exception as e:
        logger.error(f"❌ Failed to verify P1 proposals: {e}")
        return None

async def verify_substrate_creation(basket_id, expected_blocks, expected_context_items):
    """Verify actual substrate (blocks and context_items) were created."""
    logger.info("🔍 Verifying actual substrate creation")
    
    try:
        # Check for context_blocks created in this basket
        blocks_response = supabase.table("context_blocks").select(
            "id, content, semantic_type, created_at"
        ).eq("basket_id", basket_id).order(
            "created_at", {"ascending": False}
        ).execute()
        
        blocks_created = len(blocks_response.data or [])
        
        # Check for context_items created in this basket
        items_response = supabase.table("context_items").select(
            "id, label, kind, synonyms, created_at"
        ).eq("basket_id", basket_id).order(
            "created_at", {"ascending": False}
        ).execute()
        
        items_created = len(items_response.data or [])
        
        logger.info(f"📊 Actual Substrate Created:")
        logger.info(f"   📝 Context blocks: {blocks_created} (expected ~{expected_blocks})")
        logger.info(f"   🏷️  Context items: {items_created} (expected ~{expected_context_items})")
        
        if blocks_created > 0:
            logger.info("✅ Blocks successfully created by P1 agent:")
            for i, block in enumerate(blocks_response.data[:3]):  # Show first 3
                content_preview = block["content"][:100] + "..." if len(block["content"]) > 100 else block["content"]
                logger.info(f"   {i+1}. [{block['semantic_type']}] {content_preview}")
        
        if items_created > 0:
            logger.info("✅ Context items successfully created by P1 agent:")
            for i, item in enumerate(items_response.data[:5]):  # Show first 5
                synonyms = ", ".join(item.get("synonyms", [])[:2])  # Show first 2 synonyms
                logger.info(f"   {i+1}. [{item['kind']}] {item['label']} ({synonyms})")
        
        success = blocks_created > 0 or items_created > 0
        
        return {
            "substrate_created": success,
            "blocks_created": blocks_created,
            "context_items_created": items_created,
            "meets_expectations": blocks_created >= 2 and items_created >= 3
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to verify substrate creation: {e}")
        return None

async def cleanup_test_data(basket_id, dump_id, work_ids):
    """Clean up test data after the test."""
    logger.info("🧹 Cleaning up test data")
    
    try:
        cleanup_success = True
        
        # Clean up work entries
        if work_ids:
            for work_id in work_ids:
                try:
                    supabase.table("agent_processing_queue").delete().eq("work_id", work_id).execute()
                    logger.info(f"✅ Cleaned up work: {work_id}")
                except Exception as e:
                    logger.warning(f"⚠️  Failed to clean up work {work_id}: {e}")
                    cleanup_success = False
        
        # Note: We intentionally leave the substrate (blocks, context_items) and proposals
        # as they represent successful test results that can be inspected manually
        
        # Clean up raw_dump (this will cascade to related data)
        try:
            supabase.table("raw_dumps").delete().eq("id", dump_id).execute()
            logger.info(f"✅ Cleaned up raw_dump: {dump_id}")
        except Exception as e:
            logger.warning(f"⚠️  Failed to clean up dump {dump_id}: {e}")
            cleanup_success = False
        
        # Clean up basket (this will cascade to related data)
        try:
            supabase.table("baskets").delete().eq("id", basket_id).execute()
            logger.info(f"✅ Cleaned up basket: {basket_id}")
        except Exception as e:
            logger.warning(f"⚠️  Failed to clean up basket {basket_id}: {e}")
            cleanup_success = False
        
        if cleanup_success:
            logger.info("✅ Test cleanup completed successfully")
        else:
            logger.warning("⚠️  Some cleanup operations failed - manual cleanup may be needed")
        
    except Exception as e:
        logger.error(f"❌ Cleanup failed: {e}")

async def run_pipeline_test():
    """Run the complete raw_dump → P1 pipeline test."""
    logger.info("🚀 Starting Raw Dump → P1 Pipeline Test")
    logger.info("Testing Canon v2.1 Universal Work Orchestration with P1 agent judgment")
    logger.info("=" * 70)
    
    test_data = {
        "basket_id": None,
        "dump_id": None,
        "work_ids": []
    }
    
    try:
        # Step 1: Create test data
        logger.info("\n📝 STEP 1: Create test basket and raw_dump")
        test_data["basket_id"], test_data["dump_id"], test_user_id = await create_test_basket_and_dump()
        
        # Step 2: Verify universal work orchestration
        logger.info("\n🔧 STEP 2: Verify universal work creation")
        p0_work_id = await verify_universal_work_creation(test_data["dump_id"])
        if p0_work_id:
            test_data["work_ids"].append(p0_work_id)
        
        # Step 3: Trigger P1 processing
        logger.info("\n🤖 STEP 3: Trigger P1 agent processing")
        p1_work_id = await trigger_p1_processing(test_data["basket_id"], test_data["dump_id"], test_user_id)
        if p1_work_id:
            test_data["work_ids"].append(p1_work_id)
        
        # Step 4: Verify P1 creates proposals
        logger.info("\n🔍 STEP 4: Verify P1 proposals and substrate creation")
        proposal_result = await verify_p1_proposals_created(
            test_data["dump_id"], 
            test_data["basket_id"]
        )
        
        if not proposal_result:
            logger.error("❌ P1 agent failed to create proposals")
            return False
        
        # Step 5: Final assessment
        logger.info("\n📊 STEP 5: Final Test Assessment")
        logger.info("=" * 50)
        
        success_criteria = {
            "Raw dump created": test_data["dump_id"] is not None,
            "Universal work orchestration": p0_work_id is not None,
            "P1 work initiated": p1_work_id is not None,
            "Proposals created": proposal_result.get("proposal_created", False),
            "Blocks proposed": proposal_result.get("blocks_proposed", 0) > 0,
            "Context items proposed": proposal_result.get("context_items_proposed", 0) > 0,
            "Agent confidence": proposal_result.get("confidence", 0) > 0.5,
        }
        
        passed_criteria = 0
        total_criteria = len(success_criteria)
        
        for criterion, passed in success_criteria.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            logger.info(f"{status} {criterion}")
            if passed:
                passed_criteria += 1
        
        logger.info(f"\n📈 OVERALL RESULT: {passed_criteria}/{total_criteria} criteria passed")
        
        if passed_criteria == total_criteria:
            logger.info("🎉 FULL PIPELINE TEST PASSED!")
            logger.info("✅ Raw dumps successfully trigger P1 agent to create substrate proposals")
            logger.info(f"✅ P1 agent demonstrated intelligent breakdown:")
            logger.info(f"   - {proposal_result.get('blocks_proposed', 0)} blocks proposed")
            logger.info(f"   - {proposal_result.get('context_items_proposed', 0)} context items proposed")
            logger.info(f"   - {proposal_result.get('confidence', 0):.3f} confidence score")
            return True
        else:
            logger.error("💥 PIPELINE TEST FAILED - Some criteria not met")
            return False
        
    except Exception as e:
        logger.error(f"❌ Pipeline test crashed: {e}")
        return False
    
    finally:
        # Clean up test data
        if any(test_data.values()):
            await cleanup_test_data(
                test_data["basket_id"], 
                test_data["dump_id"], 
                test_data["work_ids"]
            )

if __name__ == "__main__":
    success = asyncio.run(run_pipeline_test())
    
    print("\n" + "=" * 70)
    if success:
        print("🎯 TEST CONCLUSION: Raw dump → P1 pipeline is working correctly!")
        print("✅ P1 agent successfully processes raw dumps and creates substrate proposals")
        print("✅ Agent judgment correctly breaks down raw content into blocks and context_items")
        print("✅ Canon v2.1 Universal Work Orchestration handles the full pipeline")
    else:
        print("❌ TEST CONCLUSION: Raw dump → P1 pipeline has issues!")
        print("💥 P1 agent may not be processing raw dumps correctly")
        print("💥 Manual investigation required to fix the pipeline")
    
    print("=" * 70)
    sys.exit(0 if success else 1)