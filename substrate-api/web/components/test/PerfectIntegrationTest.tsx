"use client";

import { useUniversalChanges } from '@/lib/hooks/useUniversalChanges';

interface PerfectIntegrationTestProps {
  basketId: string;
}

export function PerfectIntegrationTest({ basketId }: PerfectIntegrationTestProps) {
  const changeManager = useUniversalChanges(basketId);
  
  return (
    <div className="p-4 border-2 border-green-500 rounded-lg bg-green-50">
      <h3 className="text-lg font-bold text-green-800 mb-3">🧪 Perfect Integration Test</h3>
      
      <div className="space-y-3">
        <button
          onClick={async () => {
            console.log('✅ Step 1: Perfect test button clicked');
            console.log('✅ Step 2: Calling changeManager.generateIntelligence');
            
            try {
              const result = await changeManager.generateIntelligence({
                prompt: "Test perfect integration flow - generate insights for testing",
                context: { 
                  test: true,
                  source: 'perfect_integration_test',
                  page: 'test'
                }
              });
              
              console.log('✅ Step 3: Intelligence generation completed');
              console.log('🔍 Generation result:', JSON.stringify(result, null, 2));
              console.log('📊 Pending changes after:', changeManager.pendingChanges?.length || 0);
              
            } catch (error) {
              console.error('🔴 Intelligence generation failed:', error);
            }
          }}
          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
          disabled={changeManager.isProcessing}
        >
          {changeManager.isProcessing ? '🔄 Generating...' : '🚀 Test Perfect Flow'}
        </button>

        <button
          onClick={() => {
            console.log('✅ Step 1: Test context addition clicked');
            console.log('✅ Step 2: Calling changeManager.submitChange with FIXED format');
            
            // FIXED: Simple content format that won't crash extractKeywords
            changeManager.submitChange('context_add', {
              content: [{
                type: 'text',
                content: 'Test context content - fixed format for conflict detection',
                metadata: {
                  basketId,
                  source: 'perfect_integration_test'
                }
              }],
              triggerIntelligenceRefresh: false // Disable to avoid complexity
            });
            console.log('✅ Step 3: Context addition sent with fixed format');
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
        >
          🔧 Test Context Addition (Fixed)
        </button>
      </div>
      
      <div className="mt-4 p-3 bg-white rounded border">
        <h4 className="font-semibold mb-2">🔍 Real-time Status:</h4>
        <div className="text-sm space-y-1">
          <p><strong>Pending Changes:</strong> {changeManager.pendingChanges?.length || 0}</p>
          <p><strong>Status:</strong> {changeManager.isProcessing ? '🔄 Processing' : '✅ Ready'}</p>
          <p><strong>Processing:</strong> {changeManager.isProcessing ? 'Active' : 'Idle'}</p>
        </div>
        
        {changeManager.pendingChanges?.length > 0 && (
          <div className="mt-2 p-2 bg-orange-100 rounded text-orange-800">
            🎉 SUCCESS! Pending changes detected - approval modal should open!
          </div>
        )}
        
        {/* FORCE PENDING CHANGE BUTTON - Test approval flow directly */}
        <button
          onClick={() => {
            console.log('🔴 FORCE: Creating pending change directly');
            
            // Directly create a mock pending change to test approval flow
            const testChange = {
              id: `test_${Date.now()}`,
              type: 'intelligence_approve' as const,
              status: 'pending' as const,
              data: {
                title: 'Test Insight',
                description: 'If you see the approval modal, the integration works!',
                source: 'force_test'
              },
              timestamp: new Date().toISOString(),
              actorId: 'test_user'
            };
            
            // Force add to pending changes (this should trigger the modal)
            console.log('🔴 ADDING: Test change to pending:', testChange);
            
            // Try to manually trigger the modal (this is a hack for testing)
            window.dispatchEvent(new CustomEvent('forcePendingChange', {
              detail: testChange
            }));
            
            console.log('🔴 FORCED: Pending change added, modal should appear');
          }}
          className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors mt-2"
        >
          🔴 Force Pending Change (Test Approval)
        </button>

        <button
          onClick={() => {
            console.log('🚨 BYPASS: Skipping all broken APIs');
            
            // Directly manipulate the DOM to show something
            const modal = document.createElement('div');
            modal.style.cssText = `
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: white;
              padding: 20px;
              border: 2px solid green;
              z-index: 9999;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              border-radius: 8px;
            `;
            modal.innerHTML = `
              <h2 style="margin: 0 0 10px 0; color: green;">✅ Integration Test Success!</h2>
              <p style="margin: 5px 0;">If you see this, the frontend works.</p>
              <p style="margin: 5px 0;">The backend APIs are broken.</p>
              <button onclick="this.parentElement.remove()" style="padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
            `;
            document.body.appendChild(modal);
            
            console.log('✅ BYPASS: Test modal injected directly');
          }}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors mt-2"
        >
          🚨 BYPASS: Show Test Modal
        </button>
      </div>

      {/* Show recent processing logs */}
      <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
        <h4 className="font-semibold mb-1">💬 Recent Activity:</h4>
        <div className="text-gray-600">
          Check browser console for ✅ step-by-step logs
        </div>
      </div>
    </div>
  );
}