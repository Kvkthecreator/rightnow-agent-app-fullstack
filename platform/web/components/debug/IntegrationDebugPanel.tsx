"use client";

import { useState, useEffect } from 'react';

export function IntegrationDebugPanel() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    // Intercept console.logs to capture step-by-step progress
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    const addLog = (level: string, args: any[]) => {
      const message = args.join(' ');
      // Only capture our step-by-step logs and important events
      if (message.includes('✅') || message.includes('🔴') || message.includes('⚠️') || 
          message.includes('Step') || message.includes('Universal Changes') ||
          message.includes('changeManager') || message.includes('pending')) {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev.slice(-19), `[${timestamp}] ${level}: ${message}`]); // Keep last 20 logs
      }
    };
    
    console.log = (...args) => {
      originalLog(...args);
      addLog('LOG', args);
    };
    
    console.error = (...args) => {
      originalError(...args);
      addLog('ERR', args);
    };
    
    console.warn = (...args) => {
      originalWarn(...args);
      addLog('WARN', args);
    };
    
    return () => { 
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);
  
  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-green-600 text-white p-2 rounded-full shadow-lg z-50"
      >
        🔍 Debug
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 w-96 h-64 bg-black text-green-400 font-mono text-xs overflow-auto rounded shadow-lg z-50">
      {/* Header */}
      <div className="sticky top-0 bg-gray-800 px-3 py-2 flex justify-between items-center">
        <span className="font-bold text-green-300">🔍 Integration Debug</span>
        <div className="space-x-2">
          <button 
            onClick={() => setLogs([])}
            className="text-yellow-400 hover:text-yellow-300"
          >
            Clear
          </button>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      </div>
      
      {/* Log content */}
      <div className="p-3">
        {logs.length === 0 ? (
          <div className="text-gray-500 italic">
            Waiting for integration activity...
            <br />Click buttons to see step-by-step logs
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className={`mb-1 ${
              log.includes('ERR') ? 'text-red-400' : 
              log.includes('WARN') ? 'text-yellow-400' :
              log.includes('✅') ? 'text-green-400' :
              log.includes('🔴') ? 'text-red-400' :
              'text-green-300'
            }`}>
              {log}
            </div>
          ))
        )}
      </div>
      
      {/* Status indicator */}
      <div className="sticky bottom-0 bg-gray-800 px-3 py-1 text-center text-gray-400">
        {logs.length} events captured
      </div>
    </div>
  );
}