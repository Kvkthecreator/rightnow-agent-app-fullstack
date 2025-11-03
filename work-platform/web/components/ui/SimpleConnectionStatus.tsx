"use client";

import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface SimpleConnectionStatusProps {
  isConnected: boolean;
  className?: string;
}

/**
 * Minimal connection status indicator - only shows when disconnected
 * Removes technical complexity from user interface
 */
export function SimpleConnectionStatus({ 
  isConnected, 
  className = '' 
}: SimpleConnectionStatusProps) {
  // Only show when disconnected
  if (isConnected) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 text-sm text-orange-600 ${className}`}>
      <WifiOff className="h-4 w-4" />
      <span>Reconnecting...</span>
    </div>
  );
}

interface SimpleToastProps {
  message: string;
  type: 'success' | 'info' | 'warning';
  onDismiss: () => void;
}

/**
 * Clean, simple toast notifications without technical complexity
 */
export function SimpleToast({ message, type, onDismiss }: SimpleToastProps) {
  const bgColor = {
    success: 'bg-green-50 border-green-200 text-green-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-orange-50 border-orange-200 text-orange-800'
  }[type];

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border ${bgColor} shadow-lg max-w-sm`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onDismiss}
          className="ml-3 text-current hover:opacity-70"
        >
          ×
        </button>
      </div>
    </div>
  );
}