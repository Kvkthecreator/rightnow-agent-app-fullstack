"use client";

import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

export interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  error?: string;
  className?: string;
  showLabel?: boolean;
  onRetry?: () => void;
}

/**
 * Real-time Connection Status Indicator
 * 
 * Shows WebSocket connection status with visual indicators:
 * - Green: Connected and receiving real-time updates
 * - Yellow: Connecting/reconnecting 
 * - Red: Disconnected or error
 * - Animated indicators for processing states
 */
export function ConnectionStatus({
  isConnected,
  isConnecting,
  isReconnecting,
  error,
  className = '',
  showLabel = false,
  onRetry
}: ConnectionStatusProps) {
  const getStatusInfo = () => {
    if (isConnecting) {
      return {
        icon: RefreshCw,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        label: 'Connecting...',
        animate: true
      };
    }

    if (isReconnecting) {
      return {
        icon: RefreshCw,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        label: 'Reconnecting...',
        animate: true
      };
    }

    if (error || !isConnected) {
      return {
        icon: error ? AlertCircle : WifiOff,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: error || 'Offline',
        animate: false
      };
    }

    return {
      icon: Wifi,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'Real-time',
      animate: false
    };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className={`
          flex items-center justify-center w-8 h-8 rounded-full border
          ${statusInfo.bgColor} ${statusInfo.borderColor}
          transition-all duration-200
        `}
        title={statusInfo.label}
      >
        <Icon 
          size={16} 
          className={`
            ${statusInfo.color}
            ${statusInfo.animate ? 'animate-spin' : ''}
            transition-colors duration-200
          `}
        />
      </div>

      {showLabel && (
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          {error && (
            <span className="text-xs text-gray-500 max-w-[200px] truncate">
              {error}
            </span>
          )}
        </div>
      )}

      {/* Retry button for error states */}
      {(error || (!isConnected && !isConnecting && !isReconnecting)) && onRetry && (
        <button
          onClick={onRetry}
          className="ml-2 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          title="Retry connection"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Compact connection status dot (for minimal UI space)
 */
export function ConnectionStatusDot({
  isConnected,
  isConnecting,
  isReconnecting,
  error,
  className = ''
}: Omit<ConnectionStatusProps, 'showLabel' | 'onRetry'>) {
  const getStatusColor = () => {
    if (isConnecting || isReconnecting) return 'bg-yellow-500';
    if (error || !isConnected) return 'bg-red-500';
    return 'bg-green-500';
  };

  const getStatusLabel = () => {
    if (isConnecting) return 'Connecting to real-time updates...';
    if (isReconnecting) return 'Reconnecting to real-time updates...';
    if (error) return `Connection error: ${error}`;
    if (!isConnected) return 'Offline - no real-time updates';
    return 'Connected - receiving real-time updates';
  };

  return (
    <div 
      className={`
        w-3 h-3 rounded-full transition-all duration-200
        ${getStatusColor()}
        ${(isConnecting || isReconnecting) ? 'animate-pulse' : ''}
        ${className}
      `}
      title={getStatusLabel()}
    />
  );
}

/**
 * Banner notification for connection issues
 */
export function ConnectionBanner({
  isConnected,
  isReconnecting,
  error,
  onRetry
}: Pick<ConnectionStatusProps, 'isConnected' | 'isReconnecting' | 'error' | 'onRetry'>) {
  if (isConnected && !error) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              {isReconnecting ? 'Reconnecting...' : 'Connection Issue'}
            </p>
            <p className="text-xs text-yellow-700">
              {isReconnecting 
                ? 'Attempting to restore real-time updates'
                : error || 'Real-time updates are temporarily unavailable'
              }
            </p>
          </div>
        </div>
        {onRetry && !isReconnecting && (
          <button
            onClick={onRetry}
            className="px-3 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded hover:bg-yellow-200 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}