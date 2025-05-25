#!/usr/bin/env python3
"""
Script to backfill malformed report output_json.data fields in Supabase.
Usage: run from api/src directory: `python scripts/fix_output_json.py`
"""
import os
import sys

# Ensure project root in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.util.normalize_output import normalize_output
from app.util.supabase_helpers import get_supabase

def main():
    supa = get_supabase()
    print("Fetching all reports...")
    resp = supa.table("reports").select("id, output_json").execute()
    rows = resp.data or []
    fixed_count = 0
    for r in rows:
        rid = r.get("id")
        oj = r.get("output_json") or {}
        data = oj.get("data")
        if isinstance(data, str):
            fixed = normalize_output(data)
            new_oj = {**oj, "data": fixed}
            upd = supa.table("reports").update({"output_json": new_oj}).eq("id", rid).execute()
            if upd.error:
                print(f"Error updating {rid}: {upd.error.message}")
            else:
                print(f"Fixed report {rid}")
                fixed_count += 1
    print(f"Done. Fixed {fixed_count} reports.")

if __name__ == "__main__":
    main()