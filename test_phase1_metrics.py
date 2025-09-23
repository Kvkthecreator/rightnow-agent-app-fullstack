#!/usr/bin/env python3
"""
Phase 1 Testing Script: Document P4 improvements before/after metrics

Tests P4 composition with Phase 1 improvements on sample baskets
and documents the metrics for comparison.
"""

import asyncio
import json
import os
import sys
from datetime import datetime
from typing import Dict, Any

# Add the API source to Python path
sys.path.append('api/src')

from app.agents.pipeline.composition_agent import P4CompositionAgent, CompositionRequest

async def test_basket_composition(basket_id: str, test_intent: str = "Create a comprehensive summary") -> Dict[str, Any]:
    """Test P4 composition on a specific basket and return metrics"""
    
    print(f"\n🧪 Testing P4 composition for basket: {basket_id}")
    print(f"Intent: {test_intent}")
    
    # Create composition agent
    agent = P4CompositionAgent()
    
    # Create a test document ID (would normally be created by the API)
    document_id = f"test-doc-{basket_id}-{int(datetime.utcnow().timestamp())}"
    
    # Create composition request
    request = CompositionRequest(
        document_id=document_id,
        basket_id=basket_id,
        workspace_id="test-workspace",  # Would normally come from auth
        intent=test_intent,
        window={},  # No time window restrictions
        pinned_ids=[]
    )
    
    try:
        start_time = datetime.utcnow()
        
        # Process composition
        result = await agent.process(request)
        
        end_time = datetime.utcnow()
        processing_time = (end_time - start_time).total_seconds() * 1000
        
        # Extract Phase 1 metrics
        phase1_metrics = result.data.get('phase1_metrics', {}) if result.data else {}
        
        # Compile test results
        test_results = {
            'basket_id': basket_id,
            'document_id': document_id,
            'intent': test_intent,
            'success': result.success,
            'message': result.message,
            'total_processing_time_ms': processing_time,
            'substrate_count': result.data.get('substrate_count', 0) if result.data else 0,
            'phase1_metrics': phase1_metrics,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Print summary
        if result.success and phase1_metrics:
            print(f"✅ Success: {result.message}")
            print(f"📊 Substrate count: {phase1_metrics.get('candidates_selected', {})}")
            print(f"📈 Coverage: {phase1_metrics.get('coverage_percentage', 0):.1%}")
            print(f"🕒 Freshness: {phase1_metrics.get('freshness_score', 0):.2f}")
            print(f"🔗 Provenance: {phase1_metrics.get('provenance_percentage', 0):.1%}")
            print(f"⏱️  Processing: {phase1_metrics.get('processing_time_ms', 0)}ms")
            if phase1_metrics.get('raw_gaps_used'):
                print(f"🔍 Gap-fill: Raw content used")
        else:
            print(f"❌ Failed: {result.message}")
        
        return test_results
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return {
            'basket_id': basket_id,
            'document_id': document_id,
            'intent': test_intent,
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }

async def main():
    """Run Phase 1 testing on sample baskets"""
    
    print("🚀 Phase 1 P4 Composition Testing")
    print("=" * 50)
    
    # Test baskets (from database query)
    test_baskets = [
        'ccf6c3c4-9231-4dc0-9a24-20319727eb04',  # 20 blocks, 5 context_items, 2 raw_dumps
        'ffc54e79-9154-47e3-ab28-b14c818ea7c6',  # Different basket for comparison
        'fd070484-0327-4b5c-b113-84a5069933af'   # Another basket for comparison
    ]
    
    test_intents = [
        "Create a comprehensive project summary",
        "Analyze the key insights and recommendations", 
        "Generate an executive briefing document"
    ]
    
    all_results = []
    
    for i, basket_id in enumerate(test_baskets):
        intent = test_intents[i % len(test_intents)]
        result = await test_basket_composition(basket_id, intent)
        all_results.append(result)
    
    # Save results
    results_file = f"phase1_test_results_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
    with open(results_file, 'w') as f:
        json.dump(all_results, f, indent=2)
    
    print(f"\n📄 Results saved to: {results_file}")
    
    # Print summary statistics
    successful_tests = [r for r in all_results if r.get('success')]
    
    if successful_tests:
        print(f"\n📊 Phase 1 Test Summary:")
        print(f"Successful tests: {len(successful_tests)}/{len(all_results)}")
        
        # Calculate averages
        avg_coverage = sum(r.get('phase1_metrics', {}).get('coverage_percentage', 0) for r in successful_tests) / len(successful_tests)
        avg_freshness = sum(r.get('phase1_metrics', {}).get('freshness_score', 0) for r in successful_tests) / len(successful_tests)
        avg_provenance = sum(r.get('phase1_metrics', {}).get('provenance_percentage', 0) for r in successful_tests) / len(successful_tests)
        avg_processing = sum(r.get('phase1_metrics', {}).get('processing_time_ms', 0) for r in successful_tests) / len(successful_tests)
        
        print(f"Average coverage: {avg_coverage:.1%}")
        print(f"Average freshness: {avg_freshness:.2f}")
        print(f"Average provenance: {avg_provenance:.1%}")
        print(f"Average processing time: {avg_processing:.0f}ms")
        
        # Check for gap-fill usage
        gap_fill_used = sum(1 for r in successful_tests if r.get('phase1_metrics', {}).get('raw_gaps_used'))
        print(f"Gap-fill usage: {gap_fill_used}/{len(successful_tests)} tests")
    
    print(f"\n✅ Phase 1 testing complete!")

if __name__ == "__main__":
    # Set environment variables for testing
    os.environ.setdefault('USE_RAW_GAPS_ONLY', 'false')  # Test with gaps-only disabled initially
    
    asyncio.run(main())