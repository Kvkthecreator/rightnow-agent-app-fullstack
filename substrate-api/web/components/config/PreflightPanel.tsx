"use client";

import React from 'react';
import { runPreflightChecks, getSetupInstructions, getEnvironmentSummary } from '@/lib/config/preflight';

export default function PreflightPanel() {
  const result = runPreflightChecks();
  const instructions = getSetupInstructions(result);
  const summary = getEnvironmentSummary();

  if (result.passed) {
    return null; // Don't render if everything is OK
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.888-.833-2.664 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuration Required</h1>
          <p className="text-gray-600">
            The application needs some configuration before it can start.
          </p>
        </div>

        {/* Current Mode */}
        <div className="mb-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Current Mode:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              result.mode === 'mock' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {result.mode.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Errors */}
        {result.errors.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-red-800 mb-3">Configuration Errors</h3>
            <div className="space-y-2">
              {result.errors.map((error, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">Warnings</h3>
            <div className="space-y-2">
              {result.warnings.map((warning, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-yellow-800">{warning}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Setup Instructions */}
        {instructions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Setup Instructions</h3>
            <div className="space-y-2">
              {instructions.map((instruction, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-700">{instruction}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Environment Summary (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6">
            <details className="group">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                Environment Details (Development)
              </summary>
              <div className="mt-3 p-4 bg-gray-50 rounded-lg text-xs">
                <pre className="text-gray-700 overflow-auto">
                  {JSON.stringify(summary, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Check Again
          </button>
          
          {result.mode === 'remote' && (
            <button
              onClick={() => {
                // Switch to mock mode temporarily
                if (typeof window !== 'undefined') {
                  localStorage.setItem('OVERRIDE_API_MODE', 'mock');
                  window.location.reload();
                }
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Use Mock Mode
            </button>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Need help? Check the{' '}
            <a 
              href="https://github.com/your-org/rightnow-agent-app-fullstack" 
              className="text-blue-600 hover:text-blue-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              documentation
            </a>{' '}
            or see .env.example for configuration examples.
          </p>
        </div>
      </div>
    </div>
  );
}