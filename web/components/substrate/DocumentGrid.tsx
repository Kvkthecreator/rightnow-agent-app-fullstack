import React from 'react';
import type { DocumentSubstrateStatus, DocumentAction } from '@/lib/substrate/types';

interface DocumentGridProps {
  documents: DocumentSubstrateStatus[];
  onDocumentAction: (docId: string, action: string) => void;
}

export function DocumentGrid({ documents, onDocumentAction }: DocumentGridProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable': return 'bg-green-100 text-green-800 border-green-200';
      case 'growing': return 'bg-blue-100 text-blue-800 border-blue-200';  
      case 'review_needed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'potential': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'stable': return '✅';
      case 'growing': return '🌱';
      case 'review_needed': return '⚠️';
      case 'potential': return '💡';
      default: return '📄';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'stable': return 'Content is stable and well-aligned';
      case 'growing': return 'Actively developing with new insights';
      case 'review_needed': return 'Requires attention and review';
      case 'potential': return 'Contains untapped potential';
      default: return 'Standard document';
    }
  };

  const handleActionClick = (docId: string, action: DocumentAction) => {
    onDocumentAction(docId, action.type);
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-600">Add content below to start building your substrate intelligence.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-lg">📚</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Living Documents</h2>
            <p className="text-sm text-gray-600">{documents.length} document{documents.length !== 1 ? 's' : ''} managed</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc: any) => (
          <div key={doc.id} className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{doc.type}</p>
              </div>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(doc.status)}`}>
                <span className="mr-1">{getStatusIcon(doc.status)}</span>
                {doc.status.replace('_', ' ')}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Context Alignment:</span>
                <div className="flex items-center space-x-1">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full" 
                      style={{ width: `${doc.contextAlignment * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-900 font-medium">{Math.round(doc.contextAlignment * 100)}%</span>
                </div>
              </div>
              
              <p className="text-xs text-gray-600">{getStatusDescription(doc.status)}</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <span className="text-xs text-gray-500">
                Updated {new Date(doc.lastEvolution).toLocaleDateString()}
              </span>
              <div className="flex space-x-1">
                {doc.actions.map((action: any) => (
                  <button
                    key={action.type}
                    onClick={() => handleActionClick(doc.id, action)}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}