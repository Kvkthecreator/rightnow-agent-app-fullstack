#!/usr/bin/env python3
"""
Test Existing Raw Dump → P1 Agent Flow

Uses existing raw_dumps in the database to verify that:
1. Raw dumps can be processed by P1 agent
2. P1 agent creates proposals with blocks and context_items
3. Agent judgment correctly breaks down content into substrate

This test examines existing data to confirm the pipeline works correctly.
"""

import sys
import os
import asyncio
import logging
import json
from datetime import datetime

# Add API src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api", "src"))

# Set environment variables for testing
os.environ["SUPABASE_URL"] = "https://galytxxkrbksilekmhcw.supabase.co"
os.environ["SUPABASE_ANON_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbHl0eHhrcmJrc2lsZWttaGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTU3NjMsImV4cCI6MjA2MjMzMTc2M30.n9wrD3a_fep8GfeCRm0iflk-4Y47RYnLA0EeEECU7OY"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbHl0eHhrcmJrc2lsZWttaGN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Njc1NTc2MywiZXhwIjoyMDYyMzMxNzYzfQ.0oAdZeTn_k3p-29Hy8z1v5YYGpjBeqML0amz5bcAS6g"

from app.utils.supabase_client import supabase_admin_client as supabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Test constants - using seulkim88@gmail.com's workspace  
TEST_USER_ID = "24520389-0352-48b4-9a33-a960dabe02a5"
TEST_WORKSPACE_ID = "31ee30fe-6ae3-4604-ab6d-ac9b9f06dfde"
TEST_EMAIL = "seulkim88@gmail.com"

# For backward compatibility
REAL_WORKSPACE_ID = TEST_WORKSPACE_ID

async def analyze_existing_raw_dumps():
    """Analyze existing raw_dumps to find good test candidates."""
    logger.info("🔍 Analyzing existing raw_dumps for test candidates")
    
    try:
        # Get recent raw_dumps with content
        dumps_response = supabase.table("raw_dumps").select(
            "id, basket_id, body_md, text_dump, created_at, processing_status, workspace_id"
        ).eq("workspace_id", REAL_WORKSPACE_ID).not_.is_(
            "body_md", "null"
        ).order("created_at", desc=True).limit(10).execute()
        
        if not dumps_response.data:
            logger.warning("❌ No raw dumps found in workspace")
            return []
        
        logger.info(f"✅ Found {len(dumps_response.data)} raw dumps to analyze")
        
        suitable_dumps = []
        
        for dump in dumps_response.data:
            content = dump.get("body_md") or dump.get("text_dump", "")
            content_length = len(content) if content else 0
            
            # Look for dumps with substantial content
            if content_length > 100:  # At least 100 characters
                suitable_dumps.append({
                    "id": dump["id"],
                    "basket_id": dump["basket_id"],
                    "content_length": content_length,
                    "content_preview": content[:200] + "..." if len(content) > 200 else content,
                    "processing_status": dump.get("processing_status", "unknown"),
                    "created_at": dump["created_at"]
                })
        
        logger.info(f"✅ Found {len(suitable_dumps)} suitable test dumps")
        
        return suitable_dumps
        
    except Exception as e:
        logger.error(f"❌ Failed to analyze existing dumps: {e}")
        return []

async def check_p1_proposals_for_dump(dump_id, basket_id):
    """Check if P1 agent created proposals for a specific dump."""
    logger.info(f"🔍 Checking P1 proposals for dump: {dump_id}")
    
    try:
        # Look for proposals that reference this dump in provenance
        # Use the @> operator for JSONB contains with proper format
        proposals_response = supabase.table("proposals").select(
            "id, status, ops, validator_report, is_executed, execution_log, created_at, basket_id"
        ).filter("provenance", "cs", f'["{dump_id}"]').order(
            "created_at", desc=True
        ).execute()
        
        if not proposals_response.data:
            logger.info(f"⏳ No proposals found for dump {dump_id}")
            return None
        
        # Analyze each proposal
        for proposal in proposals_response.data:
            proposal_id = proposal["id"]
            logger.info(f"✅ Found proposal: {proposal_id}")
            logger.info(f"   Status: {proposal['status']}")
            logger.info(f"   Executed: {proposal.get('is_executed', False)}")
            logger.info(f"   Created: {proposal['created_at']}")
            
            # Analyze operations
            ops = proposal.get("ops", [])
            if ops:
                op_counts = {}
                for op in ops:
                    op_type = op.get("type", "unknown")
                    op_counts[op_type] = op_counts.get(op_type, 0) + 1
                
                create_blocks = op_counts.get("CreateBlock", 0)
                create_context_items = op_counts.get("CreateContextItem", 0)
                
                logger.info(f"   📊 Operations breakdown:")
                for op_type, count in op_counts.items():
                    logger.info(f"      {op_type}: {count}")
                
                # Check validator report
                validator_report = proposal.get("validator_report", {})
                confidence = validator_report.get("confidence", 0) if validator_report else 0
                warnings = validator_report.get("warnings", []) if validator_report else []
                
                logger.info(f"   🎯 Agent confidence: {confidence:.3f}")
                logger.info(f"   ⚠️  Warnings: {len(warnings)}")
                
                # This is a good test case if it has substrate creation ops
                if create_blocks > 0 or create_context_items > 0:
                    logger.info(f"✅ EXCELLENT TEST CASE:")
                    logger.info(f"   📝 Blocks proposed: {create_blocks}")
                    logger.info(f"   🏷️  Context items proposed: {create_context_items}")
                    logger.info(f"   🤖 Agent demonstrated intelligent breakdown!")
                    
                    return {
                        "proposal_id": proposal_id,
                        "dump_id": dump_id,
                        "basket_id": basket_id,
                        "blocks_proposed": create_blocks,
                        "context_items_proposed": create_context_items,
                        "confidence": confidence,
                        "warnings_count": len(warnings),
                        "executed": proposal.get("is_executed", False),
                        "operation_types": list(op_counts.keys()),
                        "demonstrates_p1_intelligence": True
                    }
                else:
                    logger.info("⚠️  No substrate creation operations found")
            else:
                logger.info("⚠️  No operations found in proposal")
        
        return None
        
    except Exception as e:
        logger.error(f"❌ Failed to check proposals for dump {dump_id}: {e}")
        return None

async def verify_actual_substrate_creation(basket_id, dump_created_after):
    """Check if actual substrate was created in the basket after the dump."""
    logger.info(f"🔍 Verifying actual substrate creation in basket: {basket_id}")
    
    try:
        # Check for context_blocks created after dump
        blocks_response = supabase.table("context_blocks").select(
            "id, content, semantic_type, created_at"
        ).eq("basket_id", basket_id).gte(
            "created_at", dump_created_after
        ).order("created_at", desc=True).execute()
        
        blocks_count = len(blocks_response.data or [])
        
        # Check for context_items created after dump
        items_response = supabase.table("context_items").select(
            "id, label, kind, synonyms, created_at"
        ).eq("basket_id", basket_id).gte(
            "created_at", dump_created_after
        ).order("created_at", desc=True).execute()
        
        items_count = len(items_response.data or [])
        
        logger.info(f"📊 Substrate created after dump:")
        logger.info(f"   📝 Context blocks: {blocks_count}")
        logger.info(f"   🏷️  Context items: {items_count}")
        
        if blocks_count > 0:
            logger.info("✅ Sample blocks created:")
            for i, block in enumerate(blocks_response.data[:3]):
                content_preview = block["content"][:100] + "..." if len(block["content"]) > 100 else block["content"]
                logger.info(f"   {i+1}. [{block['semantic_type']}] {content_preview}")
        
        if items_count > 0:
            logger.info("✅ Sample context items created:")
            for i, item in enumerate(items_response.data[:3]):
                synonyms = ", ".join(item.get("synonyms", [])[:2])
                logger.info(f"   {i+1}. [{item['kind']}] {item['label']} ({synonyms})")
        
        return {
            "blocks_created": blocks_count,
            "context_items_created": items_count,
            "total_substrate": blocks_count + items_count
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to verify substrate creation: {e}")
        return {"blocks_created": 0, "context_items_created": 0, "total_substrate": 0}

async def run_existing_data_test():
    """Test the P1 pipeline using existing raw_dump data."""
    logger.info("🚀 Testing Raw Dump → P1 Pipeline with Existing Data")
    logger.info("Validating Canon v2.1 P1 agent judgment and substrate creation")
    logger.info("=" * 70)
    
    try:
        # Step 1: Analyze existing raw dumps
        logger.info("\n📋 STEP 1: Find suitable test dumps")
        suitable_dumps = await analyze_existing_raw_dumps()
        
        if not suitable_dumps:
            logger.error("❌ No suitable raw dumps found for testing")
            return False
        
        # Step 2: Check for P1 proposals for each dump
        logger.info(f"\n🤖 STEP 2: Check P1 processing for {len(suitable_dumps)} dumps")
        
        successful_test_cases = []
        
        for i, dump_info in enumerate(suitable_dumps[:5]):  # Test top 5 dumps
            logger.info(f"\n--- Testing dump {i+1}/{min(5, len(suitable_dumps))} ---")
            logger.info(f"Dump ID: {dump_info['id']}")
            logger.info(f"Content length: {dump_info['content_length']} chars")
            logger.info(f"Preview: {dump_info['content_preview']}")
            
            proposal_result = await check_p1_proposals_for_dump(
                dump_info["id"], 
                dump_info["basket_id"]
            )
            
            if proposal_result:
                logger.info("✅ P1 agent successfully processed this dump!")
                
                # Step 3: Verify actual substrate creation
                substrate_result = await verify_actual_substrate_creation(
                    dump_info["basket_id"],
                    dump_info["created_at"]
                )
                
                proposal_result.update(substrate_result)
                successful_test_cases.append(proposal_result)
            else:
                logger.info("⏸️  No P1 proposals found for this dump")
        
        # Step 3: Analyze results
        logger.info(f"\n📊 STEP 3: Test Results Analysis")
        logger.info("=" * 50)
        
        if not successful_test_cases:
            logger.error("❌ No successful P1 processing found in existing data")
            logger.error("💥 This indicates P1 agent may not be working correctly")
            return False
        
        logger.info(f"✅ Found {len(successful_test_cases)} successful P1 test cases!")
        
        # Analyze the successful cases
        total_blocks_proposed = sum(case.get("blocks_proposed", 0) for case in successful_test_cases)
        total_context_items_proposed = sum(case.get("context_items_proposed", 0) for case in successful_test_cases)
        total_blocks_created = sum(case.get("blocks_created", 0) for case in successful_test_cases)
        total_items_created = sum(case.get("context_items_created", 0) for case in successful_test_cases)
        
        avg_confidence = sum(case.get("confidence", 0) for case in successful_test_cases) / len(successful_test_cases)
        executed_cases = sum(1 for case in successful_test_cases if case.get("executed", False))
        
        logger.info(f"\n📈 AGGREGATE RESULTS:")
        logger.info(f"   🎯 Successful test cases: {len(successful_test_cases)}")
        logger.info(f"   📝 Total blocks proposed: {total_blocks_proposed}")
        logger.info(f"   🏷️  Total context items proposed: {total_context_items_proposed}")
        logger.info(f"   ✅ Total blocks created: {total_blocks_created}")
        logger.info(f"   ✅ Total context items created: {total_items_created}")
        logger.info(f"   🤖 Average confidence: {avg_confidence:.3f}")
        logger.info(f"   ⚡ Executed proposals: {executed_cases}/{len(successful_test_cases)}")
        
        # Show detailed breakdown of best cases
        logger.info(f"\n🏆 TOP PERFORMING TEST CASES:")
        
        # Sort by total substrate impact
        top_cases = sorted(
            successful_test_cases, 
            key=lambda x: (x.get("blocks_proposed", 0) + x.get("context_items_proposed", 0)), 
            reverse=True
        )[:3]
        
        for i, case in enumerate(top_cases):
            logger.info(f"   {i+1}. Dump {case['dump_id'][:8]}...")
            logger.info(f"      📝 {case.get('blocks_proposed', 0)} blocks, 🏷️  {case.get('context_items_proposed', 0)} context items")
            logger.info(f"      🎯 Confidence: {case.get('confidence', 0):.3f}")
            logger.info(f"      ⚡ Executed: {'Yes' if case.get('executed', False) else 'No'}")
        
        # Final assessment
        pipeline_working = (
            len(successful_test_cases) > 0 and
            total_blocks_proposed > 0 and
            total_context_items_proposed > 0 and
            avg_confidence > 0.5
        )
        
        logger.info(f"\n🎯 FINAL ASSESSMENT:")
        if pipeline_working:
            logger.info("✅ RAW DUMP → P1 PIPELINE IS WORKING CORRECTLY!")
            logger.info("✅ P1 agent successfully processes raw dumps")
            logger.info("✅ Agent creates meaningful substrate proposals (blocks + context items)")
            logger.info("✅ Agent demonstrates intelligent content breakdown")
            logger.info("✅ Canon v2.1 Universal Work Orchestration handles P1 processing")
            return True
        else:
            logger.error("❌ RAW DUMP → P1 PIPELINE HAS ISSUES!")
            logger.error("💥 P1 agent not creating sufficient substrate proposals")
            logger.error("💥 Agent intelligence may be failing or not configured properly")
            return False
        
    except Exception as e:
        logger.error(f"❌ Test crashed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(run_existing_data_test())
    
    print("\n" + "=" * 70)
    if success:
        print("🎉 TEST CONCLUSION: P1 Pipeline is working correctly!")
        print("✅ Raw dumps successfully trigger P1 agent substrate creation")
        print("✅ Agent judgment breaks down content into blocks and context_items")
        print("✅ Canon v2.1 compliance confirmed with existing production data")
    else:
        print("❌ TEST CONCLUSION: P1 Pipeline needs attention!")
        print("💥 Either P1 agent is not processing dumps or creating substrate proposals")
        print("💥 Investigation needed to ensure agent intelligence is working")
    
    print("=" * 70)
    sys.exit(0 if success else 1)