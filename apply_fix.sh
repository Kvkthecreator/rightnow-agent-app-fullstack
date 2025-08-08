#!/bin/bash

echo "🔧 Applying RLS policy fix directly..."

# Check if we have psql command available
if ! command -v psql &> /dev/null; then
    echo "❌ psql command not found. Using supabase sql instead..."
    
    # Use supabase sql command
    cat fix.sql | npx supabase sql
    
else
    # Use psql if available
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ DATABASE_URL not set. Please set it or use supabase sql command."
        exit 1
    fi
    
    psql "$DATABASE_URL" < fix.sql
fi

echo "✅ Policy fix applied! Test context addition now."