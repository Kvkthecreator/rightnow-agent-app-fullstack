#!/usr/bin/env node

// Test Bridge Setup - Validates the 3-file minimal fix

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Bridge System Setup...\n');

// Test 1: Check API bridge route exists
const apiBridgePath = 'web/app/api/baskets/[id]/work/route.ts';
if (fs.existsSync(apiBridgePath)) {
  console.log('✅ API Bridge: route.ts created');
  const content = fs.readFileSync(apiBridgePath, 'utf8');
  if (content.includes('backendUrl') && content.includes('Manager Agent')) {
    console.log('   ✅ Contains backend proxy logic');
  } else {
    console.log('   ❌ Missing proxy logic');
  }
} else {
  console.log('❌ API Bridge: route.ts NOT FOUND');
}

// Test 2: Check database migration exists
const migrationPath = 'supabase/migrations/20250810_bridge_systems.sql';
if (fs.existsSync(migrationPath)) {
  console.log('✅ Database Bridge: migration created');
  const content = fs.readFileSync(migrationPath, 'utf8');
  if (content.includes('sync_basket_from_delta') && content.includes('basket_deltas')) {
    console.log('   ✅ Contains trigger logic');
  } else {
    console.log('   ❌ Missing trigger logic');
  }
} else {
  console.log('❌ Database Bridge: migration NOT FOUND');
}

// Test 3: Check original page still exists
const pagePath = 'web/app/baskets/[id]/work/page.tsx';
if (fs.existsSync(pagePath)) {
  console.log('✅ Frontend Page: exists');
  const content = fs.readFileSync(pagePath, 'utf8');
  if (content.includes('getBasketData') && content.includes('SubstrateManager')) {
    console.log('   ✅ Contains basket data logic');
  }
} else {
  console.log('❌ Frontend Page: NOT FOUND');
}

console.log('\n🎯 Bridge System Status:');
console.log('   1. Frontend calls /api/baskets/[id]/work');
console.log('   2. Next.js API routes to backend Manager Agent'); 
console.log('   3. Manager Agent saves to basket_deltas');
console.log('   4. Database trigger populates baskets table');
console.log('   5. Frontend page can now load basket data');

console.log('\n📋 Next Steps:');
console.log('   1. Deploy frontend: git add . && git commit -m "fix: bridge systems" && git push');
console.log('   2. Run migration: npx supabase db push');
console.log('   3. Fix backend deployment (Render is down)');
console.log('   4. Test: curl /api/baskets/test-123/work');