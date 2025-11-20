#!/usr/bin/env python3
"""
Simple test for KnowledgeModuleLoader only (no agent initialization)

Tests Phase 2d refactoring without needing env vars.
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from work_orchestration import KnowledgeModuleLoader


def main():
    print("\n" + "="*80)
    print("PHASE 2d KNOWLEDGE MODULES - LOADER TEST")
    print("="*80)

    loader = KnowledgeModuleLoader()

    # Test 1: Load for research agent
    print("\nTest 1: Loading knowledge modules for research agent...")
    research_km = loader.load_for_agent("research")

    print(f"✅ Loaded {len(research_km)} characters")

    # Check content (look for actual content from the files, not filenames)
    assert "YARNNN Research Methodology" in research_km, "Should contain Research Methodology content"
    assert "Quality Standards" in research_km or "quality" in research_km.lower(), "Should contain Quality Standards content"
    assert "Substrate" in research_km or "substrate" in research_km.lower(), "Should contain Substrate Patterns content"

    print("✅ Contains all expected module content")

    # Show snippet
    lines = research_km.split("\n")
    print(f"✅ Total lines: {len(lines)}")
    print(f"\nFirst 20 lines:\n")
    print("\n".join(lines[:20]))

    # Test 2: Load for content agent
    print("\n" + "-"*80)
    print("Test 2: Loading knowledge modules for content agent...")
    content_km = loader.load_for_agent("content")
    print(f"✅ Loaded {len(content_km)} characters for content agent")

    # Test 3: Load for reporting agent
    print("\n" + "-"*80)
    print("Test 3: Loading knowledge modules for reporting agent...")
    reporting_km = loader.load_for_agent("reporting")
    print(f"✅ Loaded {len(reporting_km)} characters for reporting agent")

    # Test 4: Verify legacy skills directory doesn't exist
    print("\n" + "-"*80)
    print("Test 4: Verifying legacy .claude/skills/ deleted...")
    legacy_path = Path(__file__).parent / ".claude" / "skills"
    assert not legacy_path.exists(), f"Legacy path should not exist: {legacy_path}"
    print("✅ Legacy .claude/skills/ successfully removed")

    # Test 5: Verify new location exists
    print("\n" + "-"*80)
    print("Test 5: Verifying new knowledge_modules location...")
    new_path = Path(__file__).parent / "src" / "agent_orchestration" / "knowledge_modules"
    assert new_path.exists(), f"New path should exist: {new_path}"
    print(f"✅ New location exists: {new_path}")

    # List files
    km_files = list(new_path.glob("*.md"))
    print(f"✅ Found {len(km_files)} knowledge module files:")
    for f in km_files:
        print(f"   - {f.name}")

    print("\n" + "="*80)
    print("ALL TESTS PASSED ✅")
    print("="*80)
    print("\nPhase 2d refactoring complete:")
    print("  - KnowledgeModuleLoader working correctly")
    print("  - Knowledge modules moved to src/agent_orchestration/knowledge_modules/")
    print("  - Legacy .claude/skills/ removed")
    print("\nNext: Test full agent initialization in production")


if __name__ == "__main__":
    try:
        main()
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
