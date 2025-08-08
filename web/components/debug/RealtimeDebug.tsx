"use client";

import React, { useState, useEffect } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';

interface RealtimeStatus {
  user?: string;
  status?: string;
  error?: any;
  tableCounts?: { [key: string]: number };
  subscriptionAttempts?: number;
}

export function RealtimeDebug() {
  const [status, setStatus] = useState<RealtimeStatus>({});
  const [isVisible, setIsVisible] = useState(process.env.NODE_ENV === 'development');
  
  useEffect(() => {
    if (!isVisible) return;
    
    const checkStatus = async () => {
      const supabase = createSupabaseClient();
      
      try {
        // Check auth
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          setStatus({ error: userError, user: 'Error' });
          return;
        }

        // Get table counts to verify access
        const [rawDumpsResult, blocksResult] = await Promise.allSettled([
          supabase.from('raw_dumps').select('id', { count: 'exact' }).limit(1),
          supabase.from('blocks').select('id', { count: 'exact' }).limit(1)
        ]);

        const tableCounts = {
          raw_dumps: rawDumpsResult.status === 'fulfilled' ? rawDumpsResult.value.count || 0 : -1,
          blocks: blocksResult.status === 'fulfilled' ? blocksResult.value.count || 0 : -1
        };
        
        // Test subscription
        let attempts = 0;
        const testChannel = supabase
          .channel('debug-test-channel')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'blocks' },
            (payload) => console.log('Debug test payload:', payload)
          )
          .subscribe((subscriptionStatus, err) => {
            attempts++;
            console.log('Debug subscription status:', subscriptionStatus, err);
            setStatus({ 
              status: subscriptionStatus, 
              error: err, 
              user: user?.id || 'Anonymous',
              tableCounts,
              subscriptionAttempts: attempts
            });
            
            // Clean up after test
            if (subscriptionStatus === 'SUBSCRIBED' || subscriptionStatus === 'CHANNEL_ERROR') {
              setTimeout(() => {
                testChannel.unsubscribe();
              }, 2000);
            }
          });
      } catch (error) {
        setStatus({ error, user: 'Error' });
      }
    };
    
    checkStatus();
  }, [isVisible]);

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 px-3 py-1 bg-gray-800 text-white text-xs rounded opacity-50 hover:opacity-100"
      >
        Debug
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-4 left-4 p-4 bg-black/90 text-white text-xs max-w-sm rounded-lg shadow-lg">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-green-400">Realtime Debug</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white ml-2"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-1">
        <div>Auth: {status.user ? '✅ ' + status.user.slice(0, 8) + '...' : '❌ Not authenticated'}</div>
        <div>Realtime: {
          status.status === 'SUBSCRIBED' ? '✅ ' + status.status :
          status.status === 'CHANNEL_ERROR' ? '❌ ' + status.status :
          status.status ? '⏳ ' + status.status : '⏸️ Not tested'
        }</div>
        
        {status.tableCounts && (
          <div>
            <div>Tables:</div>
            {Object.entries(status.tableCounts).map(([table, count]) => (
              <div key={table} className="ml-2">
                {table}: {count === -1 ? '❌ No access' : `✅ ${count} rows`}
              </div>
            ))}
          </div>
        )}
        
        {status.subscriptionAttempts && (
          <div>Attempts: {status.subscriptionAttempts}</div>
        )}
        
        {status.error && (
          <div className="text-red-400 mt-2 max-h-20 overflow-y-auto">
            Error: {JSON.stringify(status.error, null, 1)}
          </div>
        )}
      </div>
      
      <div className="mt-2 text-xs text-gray-400">
        Check console for detailed logs
      </div>
    </div>
  );
}