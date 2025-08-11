#!/usr/bin/env node

/**
 * Simple WebSocket-only test for Supabase Realtime
 * This test focuses purely on WebSocket connectivity without database permissions
 */

const { createClient } = require('@supabase/supabase-js');

// Test credentials
const SUPABASE_URL = 'https://galytxxkrbksilekmhcw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbHl0eHhrcmJrc2lsZWttaGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTU3NjMsImV4cCI6MjA2MjMzMTc2M30.n9wrD3a_fep8GfeCRm0iflk-4Y47RYnLA0EeEECU7OY';

console.log('🔌 WebSocket-Only Realtime Test');
console.log('===============================');

async function testWebSocketConnection() {
  console.log('📡 Creating Supabase client for WebSocket test...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('✅ Client created');

  return new Promise((resolve) => {
    console.log('🔌 Setting up Realtime channel...');
    
    const channel = supabase
      .channel('websocket-test-channel')
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
        console.log(`📡 Subscription status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ WebSocket connection successful!');
          console.log('🎉 Realtime is working properly');
          
          // Test complete - clean up
          setTimeout(() => {
            console.log('🧹 Cleaning up...');
            supabase.removeChannel(channel);
            console.log('✅ Test completed successfully');
            resolve(true);
          }, 2000);
          
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ WebSocket connection failed');
          if (err) {
            console.error('Error details:', err);
          }
          resolve(false);
          
        } else if (status === 'CLOSED') {
          console.log('🔌 WebSocket connection closed');
        }
      });
  });
}

// Run the test
testWebSocketConnection()
  .then((success) => {
    if (success) {
      console.log('\n🎯 CONCLUSION: WebSocket Realtime connection is WORKING');
      console.log('The CHANNEL_ERROR issue is likely due to database permissions, not WebSocket connectivity.');
    } else {
      console.log('\n❌ CONCLUSION: WebSocket connection failed');
      console.log('There is a genuine WebSocket connectivity issue.');
    }
  })
  .catch(console.error);