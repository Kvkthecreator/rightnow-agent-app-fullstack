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
          onClick={() => {
            console.log('✅ Step 1: Perfect test button clicked');
            console.log('✅ Step 2: Calling changeManager.generateIntelligence');
            changeManager.generateIntelligence({
              prompt: "Test perfect integration flow - generate insights for testing",
              context: { 
                test: true,
                source: 'perfect_integration_test',
                page: 'test'
              }
            });
            console.log('✅ Step 3: Intelligence generation request sent through Universal Changes');
          }}
          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
          disabled={changeManager.isProcessing}
        >
          {changeManager.isProcessing ? '🔄 Generating...' : '🚀 Test Perfect Flow'}
        </button>

        <button
          onClick={() => {
            console.log('✅ Step 1: Test context addition clicked');
            console.log('✅ Step 2: Calling changeManager.submitChange');
            changeManager.submitChange('context_add', {
              content: [{
                type: 'text',
                content: 'Test context content added via Universal Changes pipeline',
                metadata: {
                  basketId,
                  source: 'perfect_integration_test'
                }
              }],
              triggerIntelligenceRefresh: true
            });
            console.log('✅ Step 3: Context addition request sent through Universal Changes');
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
        >
          🧪 Test Context Addition
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