"use client";

import React, { Suspense, type ErrorInfo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

interface CenterSkeletonProps {
  type?: 'dashboard' | 'blocks' | 'documents' | 'context' | 'insights' | 'timeline';
}

function CenterSkeleton({ type = 'dashboard' }: CenterSkeletonProps) {
  return (
    <div className="flex flex-col h-full p-8 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="h-8 bg-gray-200 rounded w-32"></div>
      </div>
      
      {/* Content skeleton based on type */}
      {type === 'dashboard' && (
        <>
          {/* Metrics cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
          
          {/* Main content area */}
          <div className="flex-1 bg-gray-200 rounded-lg"></div>
        </>
      )}
      
      {(type === 'blocks' || type === 'documents') && (
        <>
          {/* List items */}
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </>
      )}
      
      {(type === 'context' || type === 'insights') && (
        <>
          {/* Grid layout */}
          <div className="grid grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-40 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </>
      )}
      
      {type === 'timeline' && (
        <>
          {/* Timeline skeleton */}
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex space-x-4">
                <div className="w-4 h-4 bg-gray-200 rounded-full mt-2"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full mb-4 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-md">
        {error.message || 'An unexpected error occurred while loading this section.'}
      </p>
      
      <div className="space-x-3">
        <button 
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
        >
          Try Again
        </button>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          Refresh Page
        </button>
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-6 text-left max-w-2xl">
          <summary className="text-sm text-gray-600 cursor-pointer mb-2">
            Error Details (Development)
          </summary>
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}

interface CenterBoundaryProps {
  children: React.ReactNode;
  skeletonType?: CenterSkeletonProps['type'];
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export default function CenterBoundary({ 
  children, 
  skeletonType = 'dashboard',
  onError 
}: CenterBoundaryProps) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        // Log error for monitoring
        console.error('[CenterBoundary] Component error:', error);
        if (process.env.NODE_ENV === 'development') {
          console.error('[CenterBoundary] Component stack:', errorInfo.componentStack || 'No stack available');
        }
        
        // Call optional error handler
        onError?.(error, errorInfo);
      }}
      onReset={() => {
        // Optional: Clear any error state or refetch data
        if (process.env.NODE_ENV === 'development') {
          console.log('[CenterBoundary] Error boundary reset');
        }
      }}
    >
      <Suspense fallback={<CenterSkeleton type={skeletonType} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}