#!/usr/bin/env python3
"""
Memory Capture Flow Test - Simulates exact production flow

Simulates what happens when user clicks "Add Memory":
1. Frontend creates raw_dump (POST /dumps)
2. Backend creates work item in canonical_queue
3. P0 validates capture
4. P1 extracts substrate (with semantic duplicate detection)
5. Governance creates proposals and auto-approves
6. Embeddings generated
7. P1→P2 cascade triggered
8. P2 infers semantic relationships
9. Frontend receives events/notifications

This test will help identify:
- Which events are emitted
- What redirects should happen
- Where the notification system breaks
- What the frontend should display
"""

import asyncio
import sys
import os
from uuid import uuid4, UUID
from datetime import datetime
import json

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from app.utils.supabase_client import supabase_admin_client as supabase


class MemoryCaptureFlowSimulator:
    """Simulates the memory capture flow and logs all events."""

    def __init__(self):
        self.events = []
        self.workspace_id = None
        self.basket_id = None
        self.dump_id = None
        self.proposal_id = None
        self.block_ids = []

    def log_event(self, stage, event_type, data):
        """Log an event for analysis."""
        self.events.append({
            "timestamp": datetime.now().isoformat(),
            "stage": stage,
            "event_type": event_type,
            "data": data
        })
        print(f"  [{stage}] {event_type}: {json.dumps(data, indent=4, default=str)}")

    async def setup_test_basket(self):
        """Create a test workspace and basket."""
        print("\n🏗️  STEP 1: Setup Test Basket")
        print("-" * 60)

        # Create test workspace
        workspace = supabase.table("workspaces").insert({
            "name": "Memory Capture Test Workspace",
            "metadata": {"test": True}
        }).execute()

        self.workspace_id = workspace.data[0]["id"]
        self.log_event("setup", "workspace_created", {"workspace_id": self.workspace_id})

        # Create test basket
        basket = supabase.table("baskets").insert({
            "workspace_id": self.workspace_id,
            "name": "Test Memory Basket",
            "basket_signature": f"test-memory-{uuid4()}",
            "metadata": {"test": True}
        }).execute()

        self.basket_id = basket.data[0]["id"]
        self.log_event("setup", "basket_created", {"basket_id": self.basket_id})

        print(f"✅ Created workspace: {self.workspace_id}")
        print(f"✅ Created basket: {self.basket_id}")

    async def simulate_frontend_add_memory(self):
        """Simulate frontend POST /dumps (user clicks 'Add Memory')."""
        print("\n📝 STEP 2: Frontend - User Clicks 'Add Memory'")
        print("-" * 60)

        # Sample memory content (similar to your production test)
        memory_content = """
        YARNNN Product Strategy Summary:

        Core Product: AI companion for product builders
        - Learns context through conversations
        - Provides coaching and strategic guidance
        - Focuses on uncovering product truths, not just documentation

        Key Metrics:
        - North-star: Daily Active Conversations (not just users)
        - Target: Build habit of using YARNNN as thinking partner

        Monetization:
        - Free tier: 30 messages/day, text only
        - Plus ($15/mo): Unlimited messages + file uploads
        - Pro ($30/mo): Unlimited + voice + advanced features
        - Heavy ($99/mo): Dedicated agent for accelerated work

        Strategic Insights:
        - Users love the "thinking together" experience
        - File context integration is highly valuable
        - Voice conversations feel more natural for ideation
        """

        # Create raw dump (this is what POST /dumps does)
        dump = supabase.table("raw_dumps").insert({
            "basket_id": self.basket_id,
            "workspace_id": self.workspace_id,
            "content": memory_content,
            "source_type": "text",
            "metadata": {"origin": "memory_capture_modal"}
        }).execute()

        self.dump_id = dump.data[0]["id"]
        self.log_event("frontend", "dump_created", {
            "dump_id": self.dump_id,
            "content_length": len(memory_content)
        })

        # Frontend also creates work item in canonical_queue
        work = supabase.table("canonical_queue").insert({
            "dump_id": self.dump_id,
            "basket_id": self.basket_id,
            "workspace_id": self.workspace_id,
            "pipeline": "P0_CAPTURE",
            "state": "pending",
            "priority": 1,
            "metadata": {"origin": "memory_capture"}
        }).execute()

        work_id = work.data[0]["id"]
        self.log_event("frontend", "work_queued", {
            "work_id": work_id,
            "pipeline": "P0_CAPTURE"
        })

        print(f"✅ Memory captured (dump_id: {self.dump_id})")
        print(f"✅ Work queued (work_id: {work_id})")

        # What should frontend do now?
        self.log_event("frontend", "user_experience", {
            "question": "Should we redirect to /governance?",
            "question": "Should we show a loading spinner?",
            "question": "Should we show a notification?",
            "question": "How does user know processing started?"
        })

    async def wait_for_canonical_processing(self):
        """Wait for canonical queue processor to handle the work."""
        print("\n⏳ STEP 3: Backend - Canonical Queue Processor")
        print("-" * 60)

        # In real system, canonical_queue_processor would pick this up
        # For this test, we'll manually check the queue

        work_items = supabase.table("canonical_queue").select("*").eq(
            "dump_id", self.dump_id
        ).execute()

        self.log_event("backend", "queue_state", {
            "work_items": len(work_items.data),
            "states": [w["state"] for w in work_items.data]
        })

        print("📋 Work items in queue:")
        for work in work_items.data:
            print(f"  - Pipeline: {work['pipeline']}, State: {work['state']}")

    async def check_p1_extraction_results(self):
        """Check if P1 extracted blocks."""
        print("\n🔍 STEP 4: P1 Extraction Results")
        print("-" * 60)

        # Check for proposals created
        proposals = supabase.table("proposals").select("*").eq(
            "basket_id", self.basket_id
        ).order("created_at", desc=True).limit(5).execute()

        if proposals.data:
            latest_proposal = proposals.data[0]
            self.proposal_id = latest_proposal["id"]

            self.log_event("p1", "proposal_created", {
                "proposal_id": self.proposal_id,
                "state": latest_proposal["state"],
                "operations_count": len(latest_proposal.get("ops", []))
            })

            print(f"✅ Proposal created: {self.proposal_id}")
            print(f"   State: {latest_proposal['state']}")
            print(f"   Operations: {len(latest_proposal.get('ops', []))}")
        else:
            print("❌ No proposals found")
            return

        # Check for created blocks
        blocks = supabase.table("blocks").select("id, title, semantic_type, state, embedding").eq(
            "basket_id", self.basket_id
        ).execute()

        self.block_ids = [b["id"] for b in blocks.data]

        self.log_event("p1", "blocks_created", {
            "count": len(blocks.data),
            "semantic_types": [b["semantic_type"] for b in blocks.data],
            "states": [b["state"] for b in blocks.data],
            "embeddings_generated": sum(1 for b in blocks.data if b.get("embedding"))
        })

        print(f"\n✅ Blocks created: {len(blocks.data)}")
        for block in blocks.data[:5]:  # Show first 5
            has_embedding = "✓" if block.get("embedding") else "✗"
            print(f"   [{has_embedding}] {block['semantic_type']}: {block['title'][:50]}...")

    async def check_p2_relationship_inference(self):
        """Check if P2 inferred relationships."""
        print("\n🕸️  STEP 5: P2 Relationship Inference")
        print("-" * 60)

        # Check for P2 work in queue
        p2_work = supabase.table("canonical_queue").select("*").eq(
            "basket_id", self.basket_id
        ).eq("pipeline", "P2_GRAPH").execute()

        if p2_work.data:
            self.log_event("p2", "work_queued", {
                "work_items": len(p2_work.data),
                "states": [w["state"] for w in p2_work.data]
            })
            print(f"✅ P2 work queued: {len(p2_work.data)} items")
        else:
            print("⚠️  No P2 work found in queue")

        # Check for relationships created
        relationships = supabase.table("substrate_relationships").select(
            "id, relationship_type, confidence_score, state, inference_method"
        ).or_(
            f"from_block_id.in.({','.join(self.block_ids)}),to_block_id.in.({','.join(self.block_ids)})"
        ).execute()

        if relationships.data:
            self.log_event("p2", "relationships_inferred", {
                "count": len(relationships.data),
                "types": [r["relationship_type"] for r in relationships.data],
                "states": [r["state"] for r in relationships.data],
                "avg_confidence": sum(r["confidence_score"] for r in relationships.data) / len(relationships.data)
            })

            print(f"\n✅ Relationships inferred: {len(relationships.data)}")
            for rel in relationships.data:
                print(f"   {rel['relationship_type']} (confidence: {rel['confidence_score']:.2f}, state: {rel['state']})")
        else:
            print("⚠️  No relationships found")

    async def check_frontend_events_notifications(self):
        """Check what events/notifications were emitted for frontend."""
        print("\n📢 STEP 6: Frontend Events & Notifications")
        print("-" * 60)

        # Check timeline_events (if table exists)
        try:
            timeline = supabase.table("timeline_events").select("*").eq(
                "basket_id", self.basket_id
            ).execute()

            self.log_event("notifications", "timeline_events", {
                "count": len(timeline.data) if timeline.data else 0,
                "event_types": [e.get("event_type") for e in (timeline.data or [])]
            })

            if timeline.data:
                print(f"✅ Timeline events: {len(timeline.data)}")
                for event in timeline.data[:5]:
                    print(f"   {event.get('event_type')}: {event.get('description', '')[:50]}...")
            else:
                print("⚠️  No timeline events found")
        except Exception as e:
            print(f"⚠️  Timeline events table error: {e}")

        # Check for real-time subscriptions (PostgreSQL NOTIFY)
        # In production, this would be via Supabase realtime
        self.log_event("notifications", "realtime_channels", {
            "question": "What channels should frontend subscribe to?",
            "suggestions": [
                f"basket:{self.basket_id}",
                f"proposals",
                f"blocks",
                f"work_queue"
            ]
        })

    async def analyze_frontend_ux_flow(self):
        """Analyze what the frontend UX should be."""
        print("\n🎨 STEP 7: Frontend UX Flow Analysis")
        print("=" * 60)

        ux_recommendations = {
            "immediate_feedback": {
                "problem": "User clicks 'Add Memory' and nothing happens",
                "recommendation": "Show immediate feedback (loading spinner or optimistic UI)",
                "implementation": "Close modal, show toast: 'Processing your memory...'"
            },
            "redirect_strategy": {
                "problem": "Should we redirect to /governance or stay on /memory?",
                "recommendation": "Stay on /memory, show inline progress",
                "reason": "Governance is for reviewing PROPOSED items. Most items auto-approve."
            },
            "progress_indicators": {
                "problem": "User doesn't know what's happening",
                "recommendation": "Show progressive status in UI",
                "stages": [
                    "1. Extracting knowledge... (P1)",
                    "2. Creating blocks... (Governance)",
                    "3. Finding relationships... (P2)",
                    "4. Complete! View your memory ✓"
                ]
            },
            "notification_system": {
                "problem": "Multiple emit events, unclear what they mean",
                "recommendation": "Consolidate to 3 key notifications",
                "notifications": [
                    "memory_processing_started",
                    "blocks_created (with count)",
                    "memory_ready (with link to view)"
                ]
            },
            "error_handling": {
                "problem": "Failures happen silently",
                "recommendation": "Show error toasts with retry option",
                "examples": [
                    "Failed to extract knowledge. Try again?",
                    "Processing taking longer than usual..."
                ]
            }
        }

        print("\n📋 RECOMMENDATIONS:\n")
        for category, details in ux_recommendations.items():
            print(f"\n{category.upper().replace('_', ' ')}")
            print("-" * 40)
            for key, value in details.items():
                if isinstance(value, list):
                    print(f"  {key}:")
                    for item in value:
                        print(f"    - {item}")
                else:
                    print(f"  {key}: {value}")

        self.log_event("analysis", "ux_recommendations", ux_recommendations)

    async def generate_event_log(self):
        """Generate complete event log for analysis."""
        print("\n📊 STEP 8: Complete Event Log")
        print("=" * 60)

        print(f"\nTotal events logged: {len(self.events)}")
        print("\nEvent timeline:")
        for i, event in enumerate(self.events, 1):
            print(f"{i}. [{event['timestamp']}] {event['stage']}.{event['event_type']}")

        # Save to file for detailed analysis
        log_file = f"memory_capture_flow_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(log_file, 'w') as f:
            json.dump(self.events, f, indent=2, default=str)

        print(f"\n✅ Detailed log saved to: {log_file}")

    async def cleanup(self):
        """Clean up test data."""
        print("\n🧹 Cleanup")
        print("-" * 60)

        try:
            # Delete blocks
            if self.block_ids:
                supabase.table("blocks").delete().in_("id", self.block_ids).execute()
                print(f"✅ Deleted {len(self.block_ids)} blocks")

            # Delete proposals
            if self.proposal_id:
                supabase.table("proposals").delete().eq("id", self.proposal_id).execute()
                print(f"✅ Deleted proposal")

            # Delete work items
            if self.dump_id:
                supabase.table("canonical_queue").delete().eq("dump_id", self.dump_id).execute()
                print(f"✅ Deleted work items")

            # Delete dump
            if self.dump_id:
                supabase.table("raw_dumps").delete().eq("id", self.dump_id).execute()
                print(f"✅ Deleted dump")

            # Delete basket
            if self.basket_id:
                supabase.table("baskets").delete().eq("id", self.basket_id).execute()
                print(f"✅ Deleted basket")

            # Delete workspace
            if self.workspace_id:
                supabase.table("workspaces").delete().eq("id", self.workspace_id).execute()
                print(f"✅ Deleted workspace")

        except Exception as e:
            print(f"⚠️  Cleanup error (non-critical): {e}")

    async def run(self):
        """Run the complete flow simulation."""
        print("\n" + "=" * 60)
        print("MEMORY CAPTURE FLOW SIMULATION")
        print("=" * 60)

        try:
            await self.setup_test_basket()
            await self.simulate_frontend_add_memory()

            print("\n⏸️  In production, canonical queue processor would handle this automatically.")
            print("   For this test, we'll check the current state.\n")

            await self.wait_for_canonical_processing()
            await self.check_p1_extraction_results()
            await self.check_p2_relationship_inference()
            await self.check_frontend_events_notifications()
            await self.analyze_frontend_ux_flow()
            await self.generate_event_log()

        finally:
            await self.cleanup()

        print("\n" + "=" * 60)
        print("SIMULATION COMPLETE")
        print("=" * 60)


async def main():
    simulator = MemoryCaptureFlowSimulator()
    await simulator.run()


if __name__ == "__main__":
    asyncio.run(main())
