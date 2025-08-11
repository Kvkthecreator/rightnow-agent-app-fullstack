#!/usr/bin/env node

/**
 * Supabase Realtime WebSocket Debug Script
 * Comprehensive testing of Supabase Realtime connections
 */

const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

// Test credentials and configuration
const SUPABASE_URL = 'https://galytxxkrbksilekmhcw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbHl0eHhrcmJrc2lsZWttaGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTU3NjMsImV4cCI6MjA2MjMzMTc2M30.n9wrD3a_fep8GfeCRm0iflk-4Y47RYnLA0EeEECU7OY';
const TEST_BASKET_ID = 'da75cf04-65e5-46ac-940a-74e2ffe077a2';

console.log('🔍 Supabase Realtime Debug Script');
console.log('==================================');
console.log(`Supabase URL: ${SUPABASE_URL}`);
console.log(`Test Basket ID: ${TEST_BASKET_ID}`);
console.log('');

async function debugRealtimeConnection() {
  console.log('📡 STEP 1: Basic Supabase Connection Test');
  console.log('-----------------------------------------');

  // Create Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('✅ Supabase client created');

  // Test basic connectivity
  try {
    const { data, error } = await supabase.from('baskets').select('id').limit(1);
    if (error) {
      console.log('❌ Basic table access failed:', error.message);
    } else {
      console.log('✅ Basic table access successful');
      console.log('   Sample data:', data);
    }
  } catch (err) {
    console.log('❌ Connection test failed:', err.message);
    return;
  }

  console.log('');
  console.log('📋 STEP 2: Table Structure Analysis');
  console.log('-----------------------------------');

  // Check if basket_events table exists and its structure
  try {
    const { data: tableData, error: tableError } = await supabase
      .from('basket_events')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ basket_events table access failed:', tableError.message);
      console.log('   Code:', tableError.code);
      console.log('   Details:', tableError.details);
    } else {
      console.log('✅ basket_events table accessible');
      console.log('   Sample record:', tableData[0] || 'No records found');
    }
  } catch (err) {
    console.log('❌ Table structure check failed:', err.message);
  }

  console.log('');
  console.log('🔌 STEP 3: Direct WebSocket Connection Test');
  console.log('-------------------------------------------');

  // Test direct WebSocket connection to Realtime endpoint
  const wsUrl = `${SUPABASE_URL.replace('https:', 'wss:')}/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
  console.log(`WebSocket URL: ${wsUrl}`);

  try {
    const ws = new WebSocket(wsUrl);
    
    ws.on('open', () => {
      console.log('✅ Direct WebSocket connection opened');
      
      // Send join message for a channel
      const joinMessage = {
        topic: `realtime:public:basket_events`,
        event: 'phx_join',
        payload: {},
        ref: '1'
      };
      
      console.log('📤 Sending join message:', JSON.stringify(joinMessage));
      ws.send(JSON.stringify(joinMessage));
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      console.log('📥 WebSocket message received:', JSON.stringify(message, null, 2));
    });

    ws.on('error', (error) => {
      console.log('❌ Direct WebSocket error:', error.message);
    });

    ws.on('close', (code, reason) => {
      console.log(`🔌 Direct WebSocket closed: ${code} - ${reason}`);
    });

    // Wait for connection test
    await new Promise(resolve => setTimeout(resolve, 5000));
    ws.close();

  } catch (err) {
    console.log('❌ Direct WebSocket test failed:', err.message);
  }

  console.log('');
  console.log('📡 STEP 4: Supabase Realtime Channel Test');
  console.log('-----------------------------------------');

  // Test Supabase realtime channel subscription
  try {
    const channel = supabase
      .channel('debug-test-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'basket_events'
        },
        (payload) => {
          console.log('📨 Realtime event received:', payload);
        }
      )
      .subscribe((status, err) => {
        console.log(`📡 Channel subscription status: ${status}`);
        if (err) {
          console.log('❌ Channel subscription error:', err);
        }
      });

    // Wait for subscription
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('📤 Attempting to insert test event...');
    
    // Try to insert a test event
    const { data: insertData, error: insertError } = await supabase
      .from('basket_events')
      .insert({
        event_type: 'debug_test',
        payload: { 
          basket_id: TEST_BASKET_ID,
          message: 'Debug test from Node.js script',
          timestamp: new Date().toISOString()
        }
      });

    if (insertError) {
      console.log('❌ Test event insertion failed:', insertError.message);
    } else {
      console.log('✅ Test event inserted successfully');
    }

    // Wait for potential realtime event
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Cleanup
    supabase.removeChannel(channel);
    console.log('🧹 Channel cleaned up');

  } catch (err) {
    console.log('❌ Supabase Realtime test failed:', err.message);
  }

  console.log('');
  console.log('🔐 STEP 5: Authentication Test');
  console.log('------------------------------');

  // Test with different authentication scenarios
  const authTestClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Check current session
  const { data: { session } } = await authTestClient.auth.getSession();
  console.log('Current session:', session ? 'exists' : 'null');
  
  if (session) {
    console.log('User ID:', session.user.id);
    console.log('Token expires at:', new Date(session.expires_at * 1000));
    
    // Parse JWT to see role
    try {
      const tokenPayload = JSON.parse(Buffer.from(session.access_token.split('.')[1], 'base64').toString());
      console.log('JWT role:', tokenPayload.role);
      console.log('JWT audience:', tokenPayload.aud);
    } catch (e) {
      console.log('Could not parse JWT:', e.message);
    }
  }

  console.log('');
  console.log('🏥 STEP 6: Realtime Service Health Check');
  console.log('----------------------------------------');

  // Check Realtime service health
  try {
    const healthResponse = await fetch(`${SUPABASE_URL}/realtime/v1/health`);
    if (healthResponse.ok) {
      const health = await healthResponse.text();
      console.log('✅ Realtime service health:', health);
    } else {
      console.log('❌ Realtime health check failed:', healthResponse.status);
    }
  } catch (err) {
    console.log('❌ Realtime health check error:', err.message);
  }

  console.log('');
  console.log('📊 STEP 7: Configuration Analysis');
  console.log('---------------------------------');

  // Analyze the JWT token
  try {
    const anonTokenPayload = JSON.parse(Buffer.from(SUPABASE_ANON_KEY.split('.')[1], 'base64').toString());
    console.log('Anon key details:');
    console.log('  Role:', anonTokenPayload.role);
    console.log('  Issuer:', anonTokenPayload.iss);
    console.log('  Reference:', anonTokenPayload.ref);
    console.log('  Expires:', new Date(anonTokenPayload.exp * 1000));
  } catch (e) {
    console.log('Could not parse anon key:', e.message);
  }

  console.log('');
  console.log('🎯 STEP 8: Targeted Basket Events Test');
  console.log('--------------------------------------');

  // Test specifically for the basket we're interested in
  try {
    const { data: basketData, error: basketError } = await supabase
      .from('baskets')
      .select('id, workspace_id')
      .eq('id', TEST_BASKET_ID)
      .single();

    if (basketError) {
      console.log('❌ Test basket not found:', basketError.message);
    } else {
      console.log('✅ Test basket found:');
      console.log('   ID:', basketData.id);
      console.log('   Workspace ID:', basketData.workspace_id);
    }

    // Check existing basket_events for this basket
    const { data: eventsData, error: eventsError } = await supabase
      .from('basket_events')
      .select('*')
      .eq('payload->basket_id', TEST_BASKET_ID)
      .limit(5)
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.log('❌ Could not fetch basket events:', eventsError.message);
    } else {
      console.log(`✅ Found ${eventsData.length} existing events for basket`);
      if (eventsData.length > 0) {
        console.log('   Latest event:', eventsData[0]);
      }
    }

  } catch (err) {
    console.log('❌ Basket events test failed:', err.message);
  }

  console.log('');
  console.log('🔧 DIAGNOSTIC SUMMARY');
  console.log('====================');
  console.log('');
  console.log('If you see CHANNEL_ERROR or subscription failures above:');
  console.log('1. Check if Realtime is enabled for basket_events table in Supabase dashboard');
  console.log('2. Verify RLS policies allow the operations you need');
  console.log('3. Ensure the table structure matches expectations');
  console.log('4. Check network connectivity and firewall settings');
  console.log('5. Verify the credentials are correct and not expired');
  console.log('');
  console.log('Next steps:');
  console.log('- Open web/test-realtime.html in browser for client-side testing');
  console.log('- Check Supabase dashboard logs for additional error details');
  console.log('- Verify table permissions and RLS policies');
  console.log('');
}

// Run the debug script
debugRealtimeConnection().catch(console.error);