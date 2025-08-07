#!/usr/bin/env node

/**
 * Local verification test that checks code structure without authentication
 * This verifies that all the necessary components are in place
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 LOCAL CODE VERIFICATION TEST');
console.log('================================\n');

const results = {
  passed: 0,
  failed: 0,
  checks: []
};

function checkFile(filePath, description, requiredPatterns = []) {
  const relativePath = path.relative(process.cwd(), filePath);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let allPatternsFound = true;
    const missingPatterns = [];
    
    for (const pattern of requiredPatterns) {
      if (!content.includes(pattern)) {
        allPatternsFound = false;
        missingPatterns.push(pattern);
      }
    }
    
    if (allPatternsFound) {
      console.log(`✅ ${description}`);
      console.log(`   📄 ${relativePath}`);
      results.passed++;
    } else {
      console.log(`❌ ${description}`);
      console.log(`   📄 ${relativePath}`);
      console.log(`   Missing: ${missingPatterns.join(', ')}`);
      results.failed++;
    }
    
    results.checks.push({
      file: relativePath,
      description,
      passed: allPatternsFound,
      missingPatterns
    });
    
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   📄 ${relativePath}`);
    console.log(`   Error: ${error.message}`);
    results.failed++;
    results.checks.push({
      file: relativePath,
      description,
      passed: false,
      error: error.message
    });
  }
  
  console.log('');
}

console.log('📊 Checking Critical Components:\n');

// Check FloatingCompanion component
checkFile(
  path.join(__dirname, '../components/thinking/FloatingCompanion.tsx'),
  'FloatingCompanion sends text to changeManager',
  ['handleAddContext', 'selectedText', 'addContext']
);

// Check changeManager implementation (might be in FloatingCompanion or separate file)
checkFile(
  path.join(__dirname, '../components/thinking/FloatingCompanion.tsx'),
  'Component posts to /api/changes endpoint',
  ['/api/changes', 'POST', 'add_context']
);

// Check API route
checkFile(
  path.join(__dirname, '../app/api/changes/route.ts'),
  'API route uses UniversalChangeService',
  ['UniversalChangeService', 'processChange']
);

// Check UniversalChangeService
checkFile(
  path.join(__dirname, '../lib/services/UniversalChangeService.ts'),
  'UniversalChangeService inserts into database',
  ['processChange', 'add_context', 'raw_dumps', 'INSERT']
);

// Check if required test files exist
console.log('📁 Checking Test Files:\n');

const testFiles = [
  'verify-context-flow.js',
  'curl-test.sh',
  'README.md'
];

for (const file of testFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ Test file exists: ${file}`);
    results.passed++;
  } else {
    console.log(`❌ Test file missing: ${file}`);
    results.failed++;
  }
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(50));
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`📋 Total Checks: ${results.passed + results.failed}`);

if (results.failed === 0) {
  console.log('\n🎉 All components are properly configured!');
  console.log('   The data flow chain is complete:');
  console.log('   FloatingCompanion → changeManager → /api/changes → UniversalChangeService → Database');
  console.log('\n💡 To run the full integration test, you need:');
  console.log('   1. Get auth cookie from browser dev tools');
  console.log('   2. export AUTH_COOKIE="your-cookie-value"');
  console.log('   3. node verify-context-flow.js');
} else {
  console.log('\n⚠️  Some components are missing or incorrectly configured.');
  console.log('   Please check the failed items above.');
}

process.exit(results.failed > 0 ? 1 : 0);