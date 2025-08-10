#!/usr/bin/env python3
"""Test script to examine worker agent interfaces and import capabilities."""

import sys
import os
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

def test_worker_imports():
    """Test if we can import the worker agents."""
    print("🔍 Testing worker agent imports...")
    
    try:
        # Try importing the main worker agents
        from app.agents.runtime.infra_basket_analyzer_agent import InfraBasketAnalyzerAgent
        print("  ✓ Successfully imported InfraBasketAnalyzerAgent")
        
        from app.agents.runtime.tasks_document_composer_agent import TasksDocumentComposerAgent  
        print("  ✓ Successfully imported TasksDocumentComposerAgent")
        
        # Check the methods available on these classes
        analyzer_methods = [method for method in dir(InfraBasketAnalyzerAgent) 
                          if not method.startswith('_') and callable(getattr(InfraBasketAnalyzerAgent, method))]
        print(f"  📝 InfraBasketAnalyzerAgent methods: {analyzer_methods}")
        
        composer_methods = [method for method in dir(TasksDocumentComposerAgent) 
                          if not method.startswith('_') and callable(getattr(TasksDocumentComposerAgent, method))]
        print(f"  📝 TasksDocumentComposerAgent methods: {composer_methods}")
        
        return True
        
    except ImportError as e:
        print(f"  ✗ Import failed: {e}")
        return False

def test_agent_instantiation():
    """Test if we can create agent instances."""
    print("\n🏗️  Testing agent instantiation...")
    
    try:
        from app.agents.runtime.infra_basket_analyzer_agent import InfraBasketAnalyzerAgent
        from app.agents.runtime.tasks_document_composer_agent import TasksDocumentComposerAgent
        
        # Try to create instances
        analyzer = InfraBasketAnalyzerAgent("test-analyzer", "test-workspace")
        print(f"  ✓ Created analyzer: {analyzer.agent_type}")
        
        composer = TasksDocumentComposerAgent("test-composer")
        print(f"  ✓ Created composer: {composer.agent_type}")
        
        return True
        
    except Exception as e:
        print(f"  ✗ Instantiation failed: {e}")
        return False

def inspect_analyze_methods():
    """Inspect the analyze method signatures."""
    print("\n🔬 Inspecting analyze method signatures...")
    
    try:
        from app.agents.runtime.infra_basket_analyzer_agent import InfraBasketAnalyzerAgent
        from app.agents.runtime.tasks_document_composer_agent import TasksDocumentComposerAgent
        import inspect
        
        # Check InfraBasketAnalyzerAgent
        analyzer = InfraBasketAnalyzerAgent("test", "test")
        
        # Look for analyze-related methods
        analyze_methods = [method for method in dir(analyzer) if 'analyze' in method.lower()]
        print(f"  📝 Analyzer analyze methods: {analyze_methods}")
        
        for method_name in analyze_methods:
            method = getattr(analyzer, method_name)
            if callable(method):
                try:
                    sig = inspect.signature(method)
                    print(f"    {method_name}{sig}")
                except:
                    print(f"    {method_name}(signature unavailable)")
        
        # Check TasksDocumentComposerAgent  
        composer = TasksDocumentComposerAgent("test")
        
        compose_methods = [method for method in dir(composer) if 'compose' in method.lower() or 'analyze' in method.lower()]
        print(f"  📝 Composer compose/analyze methods: {compose_methods}")
        
        for method_name in compose_methods:
            method = getattr(composer, method_name)
            if callable(method):
                try:
                    sig = inspect.signature(method)
                    print(f"    {method_name}{sig}")
                except:
                    print(f"    {method_name}(signature unavailable)")
        
        return True
        
    except Exception as e:
        print(f"  ✗ Method inspection failed: {e}")
        return False

def test_schema_imports():
    """Test if we can import the schemas that workers expect."""
    print("\n📋 Testing schema imports...")
    
    try:
        from schemas.basket_intelligence_schema import BasketIntelligenceReport, AgentBasketAnalysisRequest
        print("  ✓ Imported BasketIntelligenceReport")
        print("  ✓ Imported AgentBasketAnalysisRequest")
        
        from schemas.document_composition_schema import AgentCompositionRequest, ContextDrivenDocument
        print("  ✓ Imported AgentCompositionRequest") 
        print("  ✓ Imported ContextDrivenDocument")
        
        from contracts.basket import BasketChangeRequest, EntityChange
        print("  ✓ Imported BasketChangeRequest")
        print("  ✓ Imported EntityChange")
        
        return True
        
    except ImportError as e:
        print(f"  ✗ Schema import failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Worker Agent Interface Audit")
    print("=" * 50)
    
    results = []
    results.append(test_worker_imports())
    results.append(test_agent_instantiation()) 
    results.append(inspect_analyze_methods())
    results.append(test_schema_imports())
    
    print("=" * 50)
    
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"🎉 ALL TESTS PASSED ({passed}/{total})")
        print("✅ Worker agents are ready for integration!")
    else:
        print(f"❌ SOME TESTS FAILED ({passed}/{total})")
        print("🔧 Check the errors above for integration issues.")
        
    sys.exit(0 if passed == total else 1)