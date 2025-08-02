import React from 'react';
import { FileText, Server, Box, Tag } from 'lucide-react';

interface ContentInventoryProps {
  inventory: {
    documents: {
      total: number;
      withContent: number;
      totalWords: number;
      averageWords: number;
    };
    rawDumps: {
      total: number;
      processed: number;
      totalWords: number;
      contentBreakdown: Record<string, number>;
    };
    contextItems: {
      total: number;
    };
    blocks: {
      total: number;
    };
  };
}

export function ContentInventorySection({ inventory }: ContentInventoryProps) {
  const totalAnalyzableWords = inventory.documents.totalWords + inventory.rawDumps.totalWords;
  const contentPercentage = inventory.documents.total > 0 
    ? Math.round((inventory.documents.withContent / inventory.documents.total) * 100)
    : 0;

  // Calculate content breakdown percentages
  const totalBreakdownWords = Object.values(inventory.rawDumps.contentBreakdown).reduce((a, b) => a + b, 0);
  const breakdownPercentages = Object.entries(inventory.rawDumps.contentBreakdown).map(([type, words]) => ({
    type,
    words,
    percentage: totalBreakdownWords > 0 ? Math.round((words / totalBreakdownWords) * 100) : 0
  }));

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Server className="h-5 w-5 mr-2 text-gray-500" />
          Content Inventory
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          What actually exists in your workspace
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Documents */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <FileText className="h-8 w-8 text-blue-500" />
            <span className="text-2xl font-bold text-gray-900">{inventory.documents.total}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Documents</h3>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>With content:</span>
              <span className="font-medium">{inventory.documents.withContent} ({contentPercentage}%)</span>
            </div>
            <div className="flex justify-between">
              <span>Total words:</span>
              <span className="font-medium">{inventory.documents.totalWords.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg words:</span>
              <span className="font-medium">{inventory.documents.averageWords}</span>
            </div>
          </div>
          {inventory.documents.withContent === 0 && inventory.documents.total > 0 && (
            <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
              ⚠️ All documents are empty
            </div>
          )}
        </div>

        {/* Raw Dumps */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <Server className="h-8 w-8 text-green-500" />
            <span className="text-2xl font-bold text-gray-900">{inventory.rawDumps.total}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Raw Dumps</h3>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Processed:</span>
              <span className="font-medium">{inventory.rawDumps.processed}</span>
            </div>
            <div className="flex justify-between">
              <span>Total words:</span>
              <span className="font-medium">{inventory.rawDumps.totalWords.toLocaleString()}</span>
            </div>
          </div>
          {inventory.rawDumps.processed > 0 && (
            <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
              ✓ Processing working
            </div>
          )}
        </div>

        {/* Context Items */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <Tag className="h-8 w-8 text-purple-500" />
            <span className="text-2xl font-bold text-gray-900">{inventory.contextItems.total}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Context Items</h3>
          <div className="text-xs text-gray-600">
            {inventory.contextItems.total === 0 ? (
              <span>No context items yet</span>
            ) : (
              <span>Active context tracking</span>
            )}
          </div>
        </div>

        {/* Blocks */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <Box className="h-8 w-8 text-orange-500" />
            <span className="text-2xl font-bold text-gray-900">{inventory.blocks.total}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Blocks</h3>
          <div className="text-xs text-gray-600">
            {inventory.blocks.total === 0 ? (
              <span>No structured blocks</span>
            ) : (
              <span>Knowledge blocks created</span>
            )}
          </div>
        </div>
      </div>

      {/* Content Breakdown */}
      {breakdownPercentages.length > 0 && (
        <div className="mt-6 border-t pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Content Breakdown</h3>
          <div className="space-y-2">
            {breakdownPercentages.map(({ type, words, percentage }) => (
              <div key={type} className="flex items-center">
                <span className="text-xs text-gray-600 w-24 capitalize">{type}:</span>
                <div className="flex-1 mx-2">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-900 w-20 text-right">
                  {percentage}% ({words} words)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Total Analyzable Content:</span>
          <span className="text-lg font-bold text-gray-900">{totalAnalyzableWords.toLocaleString()} words</span>
        </div>
        {totalAnalyzableWords < 500 && (
          <div className="mt-2 text-xs text-orange-600">
            ⚠️ Need {500 - totalAnalyzableWords} more words for quality intelligence
          </div>
        )}
      </div>
    </div>
  );
}