#!/usr/bin/env python3
"""
Quick fix for platform/api imports - replace shared.* with local equivalents
Phase 1 deployment fix before proper architecture refactor
"""

import os
import re
from pathlib import Path

# Import mappings from shared.* to local equivalents
IMPORT_MAPPINGS = {
    # Utils mappings (shared.utils -> app.utils or utils)
    r'from shared\.utils\.supabase_client import': 'from app.utils.supabase_client import',
    r'from shared\.utils\.supabase import': 'from app.utils.supabase import',
    r'from shared\.utils\.jwt import': 'from app.utils.jwt import',
    r'from shared\.utils\.db import': 'from app.utils.db import',
    r'from shared\.utils\.workspace import': 'from app.utils.workspace import',
    r'from shared\.utils\.auth_helpers import': 'from app.utils.auth_helpers import',
    r'from shared\.utils\.errors import': 'from app.utils.errors import',

    # Substrate services mappings (shared.substrate.services -> services)
    r'from shared\.substrate\.services\.events import': 'from services.events import',
    r'from shared\.substrate\.services\.substrate_diff import': 'from services.substrate_diff import',
    r'from shared\.substrate\.services\.substrate_ops import': 'from services.substrate_ops import',
    r'from shared\.substrate\.services\.upserts import': 'from services.upserts import',
    r'from shared\.substrate\.services\.deltas import': 'from services.deltas import',
    r'from shared\.substrate\.services\.idempotency import': 'from services.idempotency import',
    r'from shared\.substrate\.services\.embedding import': 'from services.embedding import',
    r'from shared\.substrate\.services\.llm import': 'from services.llm import',
    r'from shared\.substrate\.services\.semantic_primitives import': 'from services.semantic_primitives import',
    r'from shared\.substrate\.services\.manager import': 'from services.manager import',

    # Substrate models mappings (shared.substrate.models -> models or local)
    r'from shared\.substrate\.models\.block import': 'from models.block import',
    r'from shared\.substrate\.models\.document import': 'from models.document import',
    r'from shared\.substrate\.models\.context import': 'from models.context import',
}

def fix_file(file_path: Path) -> tuple[bool, int]:
    """Fix imports in a single file. Returns (changed, num_replacements)"""
    try:
        content = file_path.read_text()
        original = content
        replacements = 0

        for pattern, replacement in IMPORT_MAPPINGS.items():
            new_content, count = re.subn(pattern, replacement, content)
            if count > 0:
                content = new_content
                replacements += count

        if content != original:
            file_path.write_text(content)
            return True, replacements
        return False, 0
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False, 0

def main():
    platform_api = Path("platform/api")

    if not platform_api.exists():
        print("Error: platform/api directory not found")
        return

    # Find all Python files
    python_files = list(platform_api.rglob("*.py"))

    total_files_changed = 0
    total_replacements = 0

    print(f"Scanning {len(python_files)} Python files in platform/api...")

    for py_file in python_files:
        changed, count = fix_file(py_file)
        if changed:
            total_files_changed += 1
            total_replacements += count
            print(f"✓ {py_file.relative_to(platform_api)}: {count} replacements")

    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Files changed: {total_files_changed}")
    print(f"  Total replacements: {total_replacements}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
