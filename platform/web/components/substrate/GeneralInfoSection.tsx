import React from 'react';
import type { SubstrateIntelligence } from '@/lib/substrate/types';

interface GeneralInfoSectionProps {
  basketInfo: SubstrateIntelligence['basketInfo'];
}

export function GeneralInfoSection({ basketInfo }: GeneralInfoSectionProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 border-green-200';
      case 'draft': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'archived': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-blue-600 bg-blue-100 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'draft': return '🟡';
      case 'archived': return '📦';
      default: return '🔵';
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-xl">🧠</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{basketInfo.name}</h1>
            <div className="flex items-center space-x-4 mt-1">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(basketInfo.status)}`}>
                <span className="mr-1">{getStatusIcon(basketInfo.status)}</span>
                {basketInfo.status.charAt(0).toUpperCase() + basketInfo.status.slice(1)}
              </span>
              <span className="text-sm text-gray-500">
                Last updated {new Date(basketInfo.lastUpdated).toLocaleDateString()}
              </span>
              <span className="text-sm text-gray-500">
                {basketInfo.documentCount} document{basketInfo.documentCount !== 1 ? 's' : ''} managed
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Workspace ID</div>
          <div className="text-sm font-mono text-gray-700">{basketInfo.workspaceId.slice(-8)}</div>
        </div>
      </div>
    </div>
  );
}