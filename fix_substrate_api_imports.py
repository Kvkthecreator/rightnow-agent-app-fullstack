#!/usr/bin/env python3
"""
Phase 2: Update substrate-api imports from shared.* to infra.*
Part of architecture refactor to establish proper domain separation
"""

import os
import re
from pathlib import Path

def fix_file(file_path: Path) -> tuple[bool, int]:
    """Fix imports in a single file. Returns (changed, num_replacements)"""
    try:
        content = file_path.read_text()
        original = content

        # Replace shared. with infra. in all import statements
        content = re.sub(r'\bfrom shared\.', 'from infra.', content)
        content = re.sub(r'\bimport shared\.', 'import infra.', content)
        content = re.sub(r'\bimport shared\b', 'import infra', content)

        replacements = len(re.findall(r'\binfra\.', content)) - len(re.findall(r'\binfra\.', original))

        if content != original:
            file_path.write_text(content)
            return True, max(replacements, 1)
        return False, 0
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False, 0

def main():
    substrate_api = Path("substrate-api")

    if not substrate_api.exists():
        print("Error: substrate-api directory not found")
        return

    # Find all Python files
    python_files = list(substrate_api.rglob("*.py"))

    total_files_changed = 0
    total_replacements = 0

    print(f"Scanning {len(python_files)} Python files in substrate-api...")

    for py_file in python_files:
        changed, count = fix_file(py_file)
        if changed:
            total_files_changed += 1
            total_replacements += count
            print(f"✓ {py_file.relative_to(substrate_api)}: {count} replacements")

    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Files changed: {total_files_changed}")
    print(f"  Total replacements: {total_replacements}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
