"use client";
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error('GlobalErrorBoundary caught error:', error);
    console.error('Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          <h1 className="text-xl font-bold text-red-600">Something went wrong</h1>
          {this.state.error && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <div className="text-sm font-medium text-red-800 mb-2">Error Details</div>
              <div className="text-sm text-red-700">{this.state.error.message}</div>
              <details className="mt-2">
                <summary className="text-xs text-red-600 cursor-pointer">Stack Trace</summary>
                <pre className="text-xs text-red-600 mt-1 overflow-auto">{this.state.error.stack}</pre>
              </details>
            </div>
          )}
          <button 
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
