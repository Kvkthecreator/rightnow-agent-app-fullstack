#!/usr/bin/env node

/**
 * Test Authenticated WebSocket Connection
 * Verifies that the WebSocket uses authenticated tokens, not anon keys
 */

const { createClient } = require('@supabase/supabase-js');

// Test credentials
const SUPABASE_URL = 'https://galytxxkrbksilekmhcw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbHl0eHhrcmJrc2lsZWttaGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTU3NjMsImV4cCI6MjA2MjMzMTc2M30.n9wrD3a_fep8GfeCRm0iflk-4Y47RYnLA0EeEECU7OY';

console.log('🔐 Testing Authenticated WebSocket Connection');
console.log('============================================');

async function testAuthenticatedWebSocket() {
  console.log('📡 Creating Supabase client...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Check current session
  const { data: { session } } = await supabase.auth.getSession();
  
  console.log('🔍 Session Check:');
  console.log(`- Has session: ${session ? 'Yes' : 'No'}`);
  
  if (session) {
    console.log(`- User ID: ${session.user.id}`);
    console.log(`- Token expires: ${new Date(session.expires_at * 1000)}`);
    
    // Parse JWT to see role
    try {
      const tokenPayload = JSON.parse(Buffer.from(session.access_token.split('.')[1], 'base64').toString());
      console.log(`- JWT Role: ${tokenPayload.role}`);
      console.log(`- JWT Audience: ${tokenPayload.aud}`);
      
      if (tokenPayload.role === 'authenticated') {
        console.log('✅ Session has authenticated role');
      } else {
        console.log('❌ Session has unexpected role');
      }
    } catch (e) {
      console.log('❌ Could not parse JWT token');
    }
  } else {
    console.log('❌ No authenticated session - will use anon key');
    console.log('   To test authenticated WebSocket, you need to log in first');
  }
  
  console.log('\n🔌 Testing WebSocket Connection...');
  
  return new Promise((resolve) => {
    // Create channel with explicit token if available
    let channelConfig = {};
    
    if (session?.access_token) {
      console.log('🔧 Using explicit access token for channel');
      channelConfig = {
        config: {
          broadcast: { self: true },
          presence: { key: session.user.id },
          params: {
            apikey: session.access_token
          }
        }
      };
    } else {
      console.log('⚠️ No access token - channel will use anon key');
    }
    
    const channel = supabase
      .channel('auth-test-channel', channelConfig)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'basket_events'
        },
        (payload) => {
          console.log('📨 Realtime event received!', payload);
        }
      )
      .subscribe((status, err) => {
        console.log(`📡 Channel status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ WebSocket connection successful!');
          
          // Test database access
          console.log('\n📋 Testing database access...');
          testDatabaseAccess(supabase);
          
          setTimeout(() => {
            console.log('\n🧹 Cleaning up...');
            supabase.removeChannel(channel);
            resolve(true);
          }, 5000);
          
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ WebSocket connection failed');
          if (err) {
            console.error('Error details:', err);
          }
          resolve(false);
        }
      });
  });
}

async function testDatabaseAccess(supabase) {
  try {
    // Test basket_events access
    const { data: events, error: eventsError } = await supabase
      .from('basket_events')
      .select('*')
      .limit(1);
    
    if (eventsError) {
      console.log(`❌ basket_events access failed: ${eventsError.message}`);
    } else {
      console.log(`✅ basket_events access successful - found ${events.length} records`);
    }
    
    // Test baskets access
    const { data: baskets, error: basketsError } = await supabase
      .from('baskets')
      .select('id')
      .limit(1);
    
    if (basketsError) {
      console.log(`❌ baskets access failed: ${basketsError.message}`);
    } else {
      console.log(`✅ baskets access successful - found ${baskets.length} records`);
    }
    
  } catch (err) {
    console.log(`❌ Database test failed: ${err.message}`);
  }
}

// Run the test
testAuthenticatedWebSocket()
  .then((success) => {
    console.log('\n🎯 TEST RESULTS:');
    if (success) {
      console.log('✅ WebSocket connection successful');
      console.log('🔐 Check the logs above to verify if authenticated token was used');
    } else {
      console.log('❌ WebSocket connection failed');
    }
    
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Run the RLS policies: setup-rls-policies.sql in Supabase SQL Editor');
    console.log('2. Test in browser with proper authenticated session');
    console.log('3. Check WebSocket URL in browser dev tools to confirm token usage');
  })
  .catch(console.error);