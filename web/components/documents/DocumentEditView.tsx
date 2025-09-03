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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 space-y-6 max-w-4xl px-4">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-semibold text-gray-900">
              Edit Document
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handlePreview}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Document Title Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Document Title</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-lg font-medium"
              placeholder="Document title..."
            />
          </CardContent>
        </Card>

        {/* Prose Content Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Authored Prose</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={proseContent}
              onChange={(e) => setProseContent(e.target.value)}
              placeholder="Write your narrative prose here. This is your authored content that will be woven together with substrate references..."
              className="w-full min-h-[400px] p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </CardContent>
        </Card>

        {/* Substrate References Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Substrate References
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>Substrate attachment interface coming soon</p>
              <p className="text-sm mt-2">Attach existing blocks, dumps, context items, reflections, timeline events</p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}