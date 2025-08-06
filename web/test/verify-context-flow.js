#!/usr/bin/env node

/**
 * End-to-End Test: Context Addition Flow
 * 
 * Verifies the complete data flow:
 * UI → changeManager → API → UniversalChangeService → Database → Substrate Update
 */

const https = require('https');
const crypto = require('crypto');

// Configuration
const BASE_URL = 'https://www.yarnnn.com';
const BASKET_ID = 'da75cf04-65e5-46ac-940a-74e2ffe077a2';

// Test content - exactly 25 words
const TEST_CONTENT = 'This is test content with twenty five words to verify that the context addition actually stores data in the substrate and updates word count correctly.';

// Helper function to make HTTP requests
async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: error.message
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Get authentication cookie from environment or user input
function getAuthCookie() {
  // In production, you'd get this from browser dev tools
  const cookie = process.env.AUTH_COOKIE;
  if (!cookie) {
    console.log('❌ ERROR: Set AUTH_COOKIE environment variable');
    console.log('   Get this from browser dev tools → Network → Cookie header');
    console.log('   export AUTH_COOKIE="sb-galytxxkrbksilekmhcw-auth-token=..."');
    process.exit(1);
  }
  return cookie;
}

// Main test function
async function testContextFlow() {
  console.log('🧪 TESTING CONTEXT ADDITION FLOW');
  console.log('=====================================');
  
  const authCookie = getAuthCookie();
  const changeId = crypto.randomUUID();
  
  console.log('📋 Test Configuration:');
  console.log(`   Basket ID: ${BASKET_ID}`);
  console.log(`   Test Content: "${TEST_CONTENT}"`);
  console.log(`   Word Count: ${TEST_CONTENT.split(' ').length} words`);
  console.log(`   Change ID: ${changeId}`);
  console.log('');

  try {
    // Step 1: Get initial substrate state
    console.log('📊 Step 1: Getting initial substrate state...');
    const initialResponse = await makeRequest(`${BASE_URL}/api/substrate/basket/${BASKET_ID}`, {
      method: 'GET',
      headers: {
        'Cookie': authCookie,
        'User-Agent': 'Context-Flow-Test/1.0'
      }
    });
    
    if (initialResponse.status !== 200) {
      throw new Error(`Failed to get initial substrate: ${initialResponse.status}`);
    }
    
    const initialWordCount = calculateWordCount(initialResponse.data);
    console.log(`   ✅ Initial state retrieved`);
    console.log(`   📈 Current word count: ${initialWordCount}`);
    console.log('');

    // Step 2: Add context via Universal Change System
    console.log('➕ Step 2: Adding context via /api/changes...');
    
    const addPayload = {
      id: changeId,
      type: 'context_add',
      basketId: BASKET_ID,
      data: {
        content: [{
          type: 'text',
          content: TEST_CONTENT,
          metadata: { 
            source: 'end-to-end-test',
            timestamp: new Date().toISOString(),
            testId: changeId
          }
        }],
        triggerIntelligenceRefresh: false // Don't trigger intelligence for this test
      },
      metadata: {
        testRun: true,
        timestamp: new Date().toISOString()
      },
      origin: 'test'
    };
    
    console.log('   📤 Sending request to /api/changes...');
    const addResponse = await makeRequest(`${BASE_URL}/api/changes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie,
        'User-Agent': 'Context-Flow-Test/1.0'
      },
      body: JSON.stringify(addPayload)
    });
    
    console.log(`   📥 Response status: ${addResponse.status}`);
    
    if (addResponse.status !== 200) {
      console.error('   ❌ Failed to add context');
      console.error('   Response:', JSON.stringify(addResponse.data, null, 2));
      throw new Error(`Context addition failed: ${addResponse.status}`);
    }
    
    if (addResponse.data?.success) {
      console.log('   ✅ Context addition successful');
      console.log(`   🆔 Change ID: ${addResponse.data.changeId}`);
    } else {
      console.error('   ❌ Context addition returned success=false');
      console.error('   Response:', JSON.stringify(addResponse.data, null, 2));
      throw new Error('Context addition failed');
    }
    console.log('');

    // Step 3: Wait a moment for processing
    console.log('⏳ Step 3: Waiting for processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('   ⏰ Wait complete');
    console.log('');

    // Step 4: Check updated substrate
    console.log('📊 Step 4: Getting updated substrate state...');
    const finalResponse = await makeRequest(`${BASE_URL}/api/substrate/basket/${BASKET_ID}`, {
      method: 'GET',
      headers: {
        'Cookie': authCookie,
        'User-Agent': 'Context-Flow-Test/1.0'
      }
    });
    
    if (finalResponse.status !== 200) {
      throw new Error(`Failed to get final substrate: ${finalResponse.status}`);
    }
    
    const finalWordCount = calculateWordCount(finalResponse.data);
    console.log(`   ✅ Final state retrieved`);
    console.log(`   📈 Final word count: ${finalWordCount}`);
    console.log('');

    // Step 5: Verify the change
    console.log('🔍 Step 5: Analyzing results...');
    const wordCountIncrease = finalWordCount - initialWordCount;
    const expectedIncrease = TEST_CONTENT.split(' ').length;
    
    console.log(`   📊 Word count change: +${wordCountIncrease} (expected: +${expectedIncrease})`);
    
    if (wordCountIncrease > 0) {
      console.log('   ✅ SUCCESS: Word count increased!');
      
      if (wordCountIncrease >= expectedIncrease) {
        console.log('   🎯 PERFECT: Increase matches or exceeds expectation');
      } else {
        console.log('   ⚠️  PARTIAL: Increase detected but less than expected');
      }
    } else {
      console.log('   ❌ FAILURE: Word count unchanged');
      throw new Error('Context addition had no effect on substrate');
    }

    // Step 6: Detailed verification
    console.log('');
    console.log('📋 Step 6: Detailed verification...');
    
    if (finalResponse.data.documents) {
      console.log(`   📄 Documents: ${finalResponse.data.documents.length}`);
    }
    
    if (finalResponse.data.intelligence?.recentActivity) {
      console.log(`   🔄 Recent Activity: ${finalResponse.data.intelligence.recentActivity.length} items`);
    }
    
    console.log('   ✅ Verification complete');

  } catch (error) {
    console.log('');
    console.error('💥 TEST FAILED:', error.message);
    console.error('');
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }

  console.log('');
  console.log('🎉 TEST COMPLETED SUCCESSFULLY!');
  console.log('=====================================');
  console.log('✅ Context addition flow is working correctly');
  console.log('✅ Data flows from API to database to substrate');
  console.log('✅ Word count updates as expected');
}

// Helper function to calculate word count from substrate data
function calculateWordCount(substrateData) {
  if (!substrateData) return 0;
  
  let totalWords = 0;
  
  // Count words from documents
  if (substrateData.documents && Array.isArray(substrateData.documents)) {
    totalWords += substrateData.documents.reduce((sum, doc) => {
      if (doc.content_raw && typeof doc.content_raw === 'string') {
        return sum + doc.content_raw.split(/\s+/).filter(word => word.length > 0).length;
      }
      return sum;
    }, 0);
  }
  
  // Count words from intelligence insights and recommendations  
  if (substrateData.intelligence?.insights && Array.isArray(substrateData.intelligence.insights)) {
    totalWords += substrateData.intelligence.insights.reduce((sum, insight) => {
      if (insight.description && typeof insight.description === 'string') {
        return sum + insight.description.split(/\s+/).filter(word => word.length > 0).length;
      }
      return sum;
    }, 0);
  }
  
  if (substrateData.intelligence?.recommendations && Array.isArray(substrateData.intelligence.recommendations)) {
    totalWords += substrateData.intelligence.recommendations.reduce((sum, rec) => {
      if (rec.description && typeof rec.description === 'string') {
        return sum + rec.description.split(/\s+/).filter(word => word.length > 0).length;
      }
      return sum;
    }, 0);
  }
  
  return totalWords;
}

// Handle command line execution
if (require.main === module) {
  console.log('🚀 Starting Context Addition Flow Test');
  console.log('');
  testContextFlow().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { testContextFlow };