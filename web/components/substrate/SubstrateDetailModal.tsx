"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { FileText, Database, Link2, Hash, Clock, Copy, ExternalLink, X } from 'lucide-react';
import { fetchWithToken } from '@/lib/fetchWithToken';

interface SubstrateDetailModalProps {
  substrateType: 'raw_dump' | 'block' | 'context_item' | 'relationship' | 'timeline_event';
  substrateId: string;
  basketId: string;
  open: boolean;
  onClose: () => void;
}

interface SubstrateDetail {
  id: string;
  created_at: string;
  // Raw dump fields
  body_md?: string;
  file_url?: string;
  processing_status?: string;
  processed_at?: string;
  // Block fields
  title?: string;
  content?: string;
  semantic_type?: string;
  state?: string;
  confidence_score?: number;
  // Context item fields
  label?: string;
  kind?: string;
  synonyms?: string[];
  description?: string;
  // Relationship fields
  from_type?: string;
  from_id?: string;
  to_type?: string;
  to_id?: string;
  relationship_type?: string;
  strength?: number;
  // Timeline event fields
  event_kind?: string;
  preview?: string;
  ref_id?: string;
  payload?: any;
}

interface HistoryEntry {
  timestamp: string;
  action: string;
  details?: string;
  agent?: string;
}

export default function SubstrateDetailModal({
  substrateType,
  substrateId,
  basketId,
  open,
  onClose
}: SubstrateDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'history'>('content');
  const [substrate, setSubstrate] = useState<SubstrateDetail | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && substrateId) {
      loadSubstrate();
      loadHistory();
    }
  }, [open, substrateId, substrateType]);

  const loadSubstrate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Map substrate types to API endpoints
      const endpoints: Record<string, string> = {
        'raw_dump': `/api/baskets/${basketId}/dumps/${substrateId}`,
        'block': `/api/baskets/${basketId}/building-blocks/${substrateId}`,
        'context_item': `/api/baskets/${basketId}/context-items/${substrateId}`,
        'relationship': `/api/baskets/${basketId}/relationships/${substrateId}`,
        'timeline_event': `/api/baskets/${basketId}/timeline/${substrateId}`
      };
      
      const response = await fetchWithToken(endpoints[substrateType]);
      if (!response.ok) throw new Error('Failed to load substrate details');
      
      const data = await response.json();
      setSubstrate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load substrate');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    // Simulate loading history - in real implementation, this would call an API
    setHistory([
      {
        timestamp: substrate?.created_at || new Date().toISOString(),
        action: 'Created',
        agent: substrateType === 'raw_dump' ? 'P0 Capture' : 'P1 Extraction'
      }
    ]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getIcon = () => {
    switch (substrateType) {
      case 'raw_dump': return <FileText className="h-4 w-4" />;
      case 'block': return <Database className="h-4 w-4" />;
      case 'context_item': return <Hash className="h-4 w-4" />;
      case 'relationship': return <Link2 className="h-4 w-4" />;
      case 'timeline_event': return <Clock className="h-4 w-4" />;
    }
  };

  const getTitle = () => {
    switch (substrateType) {
      case 'raw_dump': return `Raw Dump - ${formatTimestamp(substrate?.created_at || '')}`;
      case 'block': return `Block - ${substrate?.semantic_type || 'Unknown Type'}`;
      case 'context_item': return `Context Item - ${substrate?.label || 'Unnamed'}`;
      case 'relationship': return 'Relationship';
      case 'timeline_event': return `Event - ${substrate?.event_kind || 'Unknown'}`;
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className="p-6 text-center text-gray-500">Loading...</div>;
    }

    if (error) {
      return <div className="p-6 text-center text-red-600">Error: {error}</div>;
    }

    if (!substrate) {
      return <div className="p-6 text-center text-gray-500">No data found</div>;
    }

    switch (substrateType) {
      case 'raw_dump':
        return (
          <div className="space-y-4">
            {substrate.body_md && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Text Content</h4>
                <div className="bg-gray-50 p-3 rounded text-sm text-gray-800 max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {substrate.body_md}
                </div>
              </div>
            )}
            {substrate.file_url && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">File Info</h4>
                <div className="flex items-center gap-2 text-sm">
                  <span>Filename:</span>
                  <span className="font-mono text-blue-600">{substrate.file_url.split('/').pop()}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(substrate.file_url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Processing Status: <span className="font-medium">{substrate.processing_status || 'completed'}</span></span>
              <span>Created: {formatTimestamp(substrate.created_at)}</span>
            </div>
          </div>
        );

      case 'block':
        return (
          <div className="space-y-4">
            {substrate.title && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Title</h4>
                <p className="text-sm">{substrate.title}</p>
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Type</h4>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {substrate.semantic_type}
              </span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Content</h4>
              <div className="bg-gray-50 p-3 rounded text-sm text-gray-800 max-h-64 overflow-y-auto">
                {substrate.content || 'No content'}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Confidence: <span className="font-medium">{((substrate.confidence_score || 0) * 100).toFixed(0)}%</span></span>
              <span>State: <span className="font-medium">{substrate.state || 'ACCEPTED'}</span></span>
            </div>
          </div>
        );

      case 'context_item':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Label</h4>
              <p className="text-lg font-medium">{substrate.label}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Kind</h4>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {substrate.kind}
              </span>
            </div>
            {substrate.synonyms && substrate.synonyms.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Synonyms</h4>
                <div className="flex flex-wrap gap-1">
                  {substrate.synonyms.map((syn, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs">{syn}</span>
                  ))}
                </div>
              </div>
            )}
            {substrate.description && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                <p className="text-sm text-gray-800">{substrate.description}</p>
              </div>
            )}
            <div className="text-sm text-gray-600">
              <span>State: <span className="font-medium">ACTIVE</span></span>
            </div>
          </div>
        );

      case 'relationship':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">From:</span>
              <span className="bg-gray-100 px-2 py-1 rounded">{substrate.from_type} ({substrate.from_id?.slice(0, 8)}...)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Type:</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">{substrate.relationship_type}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">To:</span>
              <span className="bg-gray-100 px-2 py-1 rounded">{substrate.to_type} ({substrate.to_id?.slice(0, 8)}...)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Strength:</span>
              <span>{((substrate.strength || 0) * 100).toFixed(0)}%</span>
            </div>
            {substrate.description && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                <p className="text-sm text-gray-800">{substrate.description}</p>
              </div>
            )}
          </div>
        );

      case 'timeline_event':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Event</h4>
              <p className="text-sm font-medium">{substrate.event_kind}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Preview</h4>
              <p className="text-sm">{substrate.preview}</p>
            </div>
            {substrate.ref_id && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Reference</h4>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{substrate.ref_id}</code>
              </div>
            )}
            <div className="text-sm text-gray-600">
              <span>Time: {formatTimestamp(substrate.created_at)}</span>
            </div>
          </div>
        );
    }
  };

  const renderHistory = () => {
    return (
      <div className="space-y-3">
        {history.map((entry, index) => (
          <div key={index} className="flex items-start gap-3 text-sm">
            <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-gray-900">{entry.action}</div>
              <div className="text-gray-600">
                {formatTimestamp(entry.timestamp)}
                {entry.agent && <span> by {entry.agent}</span>}
              </div>
              {entry.details && <div className="text-gray-500 mt-1">{entry.details}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <h3 className="text-lg font-medium text-gray-900">{getTitle()}</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'content'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('content')}
            >
              Content
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('history')}
            >
              History
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'content' ? renderContent() : renderHistory()}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(substrateId)}
            className="flex items-center gap-2"
          >
            <Copy className="h-3 w-3" />
            Copy ID
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}