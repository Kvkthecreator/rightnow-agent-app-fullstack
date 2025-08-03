"use client";

import React, { useState } from 'react';
import { Edit2, Clock, Hash } from 'lucide-react';

interface IdentityAnchorHeaderProps {
  basketName: string;
  suggestedName?: string;
  status: 'evolving' | 'exploring' | 'developing' | 'established';
  lastActive: string;
  basketId: string;
  onNameChange?: (newName: string) => void;
}

const statusConfig = {
  evolving: { emoji: '🟡', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  exploring: { emoji: '🔵', color: 'text-blue-600', bg: 'bg-blue-50' },
  developing: { emoji: '🟠', color: 'text-orange-600', bg: 'bg-orange-50' },
  established: { emoji: '🟢', color: 'text-green-600', bg: 'bg-green-50' }
};

export function IdentityAnchorHeader({ 
  basketName, 
  suggestedName, 
  status, 
  lastActive, 
  basketId,
  onNameChange 
}: IdentityAnchorHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(basketName);
  const [showSuggestion, setShowSuggestion] = useState(true);

  const handleSave = () => {
    if (onNameChange && editName.trim() !== basketName) {
      onNameChange(editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditName(basketName);
      setIsEditing(false);
    }
  };

  const applySuggestion = () => {
    if (suggestedName && onNameChange) {
      onNameChange(suggestedName);
      setEditName(suggestedName);
      setShowSuggestion(false);
    }
  };

  const formatLastActive = (timestamp: string) => {
    const now = new Date();
    const lastActiveDate = new Date(timestamp);
    const diffInMs = now.getTime() - lastActiveDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInDays === 1) return 'Yesterday';
    return `${diffInDays} days ago`;
  };

  const shortId = basketId.slice(0, 8);
  const config = statusConfig[status];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      {/* Main Identity */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🧠</span>
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyPress}
                className="text-xl font-semibold text-gray-900 bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1"
                autoFocus
              />
            ) : (
              <h1 className="text-xl font-semibold text-gray-900 flex-1">
                {basketName}
              </h1>
            )}
            {!isEditing && onNameChange && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Edit basket name"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status and Metadata */}
          <div className="flex items-center gap-4 text-sm">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bg}`}>
              <span className="text-lg">{config.emoji}</span>
              <span className={`font-medium capitalize ${config.color}`}>{status}</span>
            </div>
            
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Last active {formatLastActive(lastActive)}</span>
            </div>
            
            <div className="flex items-center gap-1 text-gray-400">
              <Hash className="h-4 w-4" />
              <span className="font-mono text-xs">{shortId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Rename */}
      {suggestedName && showSuggestion && suggestedName !== basketName && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Suggested rename:</span> "{suggestedName}"
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Based on your recent thinking patterns and content focus
              </p>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={applySuggestion}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded transition-colors"
              >
                Apply
              </button>
              <button
                onClick={() => setShowSuggestion(false)}
                className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}