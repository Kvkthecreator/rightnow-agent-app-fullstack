"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, Eye, FileText, Link } from 'lucide-react';

interface DocumentEditViewProps {
  document: {
    id: string;
    basket_id: string;
    title: string;
    content_raw?: string;
    created_at: string;
    updated_at: string;
    metadata: Record<string, any>;
  };
  basketId: string;
}

export function DocumentEditView({ document, basketId }: DocumentEditViewProps) {
  const [title, setTitle] = useState(document.title);
  const [proseContent, setProseContent] = useState(document.content_raw || '');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save document changes via API
      const response = await fetch(`/api/documents/${document.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content_raw: proseContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save document');
      }

      router.push(`/baskets/${basketId}/documents/${document.id}`);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save document. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    router.push(`/baskets/${basketId}/documents/${document.id}`);
  };

  const handleCancel = () => {
    router.push(`/baskets/${basketId}/documents/${document.id}`);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Edit Document
                </h1>
                <p className="text-xs text-gray-500 mt-1">Compose narrative + substrate references</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handlePreview}
                size="sm"
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          
          {/* Document Title Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded text-sm"
              placeholder="Document title..."
            />
          </div>

          {/* Prose Content Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Authored Prose
            </label>
            <textarea
              value={proseContent}
              onChange={(e) => setProseContent(e.target.value)}
              placeholder="Write your narrative prose here. This content will be woven together with substrate references..."
              className="w-full min-h-[300px] p-3 border border-gray-200 rounded resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Substrate References Panel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Link className="h-4 w-4" />
              Substrate References
            </label>
            <div className="border border-gray-200 rounded p-4 bg-gray-50">
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">Substrate attachment interface coming soon</p>
                <p className="text-xs text-gray-400 mt-1">Attach existing blocks, dumps, context items, reflections, timeline events</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}