# End-to-End Testing for Context Addition Flow

This directory contains tests to verify the complete data flow from UI interaction to database storage and substrate updates.

## The Problem We're Testing

After multiple refactors, the system had "ghost success" where:
- ✅ UI showed success messages  
- ❌ No actual backend action occurred
- ❌ Substrate remained unchanged despite user actions
- ❌ Intelligence had nothing new to analyze

## Test Files

### 1. `verify-context-flow.js` - Comprehensive Node.js Test

**Features:**
- ✅ Tests complete API flow: `/api/changes` → `UniversalChangeService` → Database
- ✅ Verifies word count changes in substrate
- ✅ Detailed step-by-step logging
- ✅ Comprehensive error handling

**Usage:**
```bash
# Get auth cookie from browser dev tools
export AUTH_COOKIE="sb-galytxxkrbksilekmhcw-auth-token=..."

# Run the test
node test/verify-context-flow.js
```

**Expected Output:**
```
🧪 TESTING CONTEXT ADDITION FLOW
📊 Initial word count: 15
➕ Context addition successful  
📊 Final word count: 40
✅ SUCCESS: Word count increased!
🎉 TEST COMPLETED SUCCESSFULLY!
```

### 2. `curl-test.sh` - Simple cURL Test

**Features:**
- ✅ Quick command-line test
- ✅ No Node.js dependencies
- ✅ Basic success/failure verification

**Usage:**
```bash
# Get auth cookie from browser dev tools
./test/curl-test.sh 'sb-galytxxkrbksilekmhcw-auth-token=...'
```

## Getting Your Auth Cookie

1. Open browser dev tools (F12)
2. Go to **Network** tab
3. Visit `https://www.yarnnn.com`
4. Find any request to `www.yarnnn.com`
5. Copy the **Cookie** header value
6. Use it in the tests

**Example Cookie:**
```
sb-galytxxkrbksilekmhcw-auth-token=%5B%22eyJhbGciOiJI...%22%2C%22cl6bozzxikg3%22%2Cnull%2Cnull%2Cnull%5D
```

## What The Tests Verify

### ✅ Complete Data Flow
1. **API Request**: POST `/api/changes` with `context_add` type
2. **Change Processing**: `UniversalChangeService.processChange()`
3. **Database Insert**: New entry in `raw_dumps` table  
4. **Substrate Update**: Word count increases
5. **Intelligence Availability**: New content ready for analysis

### ✅ Debug Logging
Both tests include comprehensive logging to verify each step:
- `🎯 Step 1`: Initial state retrieval
- `🎯 Step 2`: Context addition API call
- `🎯 Step 3`: Processing wait
- `🎯 Step 4`: Final state retrieval  
- `🎯 Step 5`: Results analysis

### ✅ Error Detection
Tests catch common failures:
- Authentication failures (401/403)
- API endpoint errors (404/500)
- Database insertion failures
- Substrate update failures
- Ghost success scenarios

## Test Data

**Test Content:** 25 words
```
"This is test content with twenty five words to verify that the context addition actually stores data in the substrate and updates word count correctly."
```

**Expected Results:**
- Word count increases by 25
- New `raw_dumps` entry created
- Substrate reflects the change
- Intelligence can analyze the content

## Troubleshooting

### Auth Cookie Issues
```bash
# Test cookie validity
curl -H "Cookie: YOUR_COOKIE" https://www.yarnnn.com/api/system-check
```

### API Endpoint Issues  
```bash
# Test basic connectivity
curl https://www.yarnnn.com/api/system-check
```

### Debug Mode
The Node.js test includes comprehensive logging. Look for:
- `🎯` Step-by-step execution
- `❌` Error indicators  
- `✅` Success confirmations

## Production Impact

These tests verify that the critical fix applied to `FloatingCompanion.tsx` works:

**Before:** `onCapture()` → Dead end ❌
**After:** `changeManager.addContext()` → Full data flow ✅

This ensures the production system has working context addition functionality.