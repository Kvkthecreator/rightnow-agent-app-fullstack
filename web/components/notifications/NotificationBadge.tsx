/**
 * YARNNN Notification Badge Component - Canon v1.0.0 Compliant
 * 
 * Unified notification indicator for navigation and UI components.
 * Replaces all legacy badge implementations.
 */

"use client";

import React from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface NotificationBadgeProps {
  count: number;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'prominent';
}

export function NotificationBadge({ 
  count, 
  onClick, 
  className = "",
  size = 'md',
  variant = 'default'
}: NotificationBadgeProps) {
  if (count === 0) return null;

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20
  };

  const getBadgeVariant = () => {
    if (count > 9) return 'destructive'; // High priority
    if (count > 3) return 'secondary'; // Medium priority
    return 'default'; // Normal
  };

  const getBadgePosition = () => {
    switch (size) {
      case 'sm': return '-top-1 -right-1';
      case 'lg': return '-top-2 -right-2';
      default: return '-top-1.5 -right-1.5';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center justify-center rounded-full
        ${sizeClasses[size]}
        ${variant === 'minimal' 
          ? 'text-gray-600 hover:text-gray-900' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }
        ${variant === 'prominent' ? 'bg-blue-50 border border-blue-200' : ''}
        transition-all duration-200
        ${className}
      `}
      title={`${count} notification${count === 1 ? '' : 's'}`}
    >
      <Bell size={iconSizes[size]} />
      
      <Badge 
        variant={getBadgeVariant()}
        className={`
          absolute ${getBadgePosition()}
          min-w-[20px] h-5 px-1 py-0 
          flex items-center justify-center 
          text-xs font-bold leading-none
          ${count > 99 ? 'text-[10px]' : 'text-xs'}
        `}
      >
        {count > 99 ? '99+' : count}
      </Badge>
    </button>
  );
}

/**
 * Compact inline badge for use in lists or small UI elements
 */
export function InlineNotificationBadge({ 
  count, 
  className = "" 
}: { 
  count: number; 
  className?: string; 
}) {
  if (count === 0) return null;

  return (
    <Badge 
      variant={count > 5 ? 'destructive' : 'secondary'}
      className={`
        ml-2 min-w-[20px] h-5 px-1.5 py-0
        flex items-center justify-center
        text-xs font-medium
        ${className}
      `}
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
}

/**
 * Category-specific notification badge with color coding
 */
export function CategoryNotificationBadge({ 
  category, 
  count, 
  onClick,
  className = "" 
}: { 
  category: 'substrate' | 'presentation' | 'work' | 'governance' | 'system';
  count: number;
  onClick?: () => void;
  className?: string;
}) {
  if (count === 0) return null;

  const getCategoryColor = () => {
    switch (category) {
      case 'substrate': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'presentation': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'governance': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'work': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 px-2 py-1 rounded-full border
        ${getCategoryColor()}
        hover:opacity-80 transition-opacity
        ${className}
      `}
      title={`${count} ${category} notification${count === 1 ? '' : 's'}`}
    >
      <span className="text-xs font-medium capitalize">
        {category}
      </span>
      <Badge 
        className="min-w-[18px] h-4 px-1 py-0 text-xs font-bold bg-white/20"
      >
        {count > 99 ? '99+' : count}
      </Badge>
    </button>
  );
}