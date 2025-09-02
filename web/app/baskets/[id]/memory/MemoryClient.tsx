"use client";

import { useState } from 'react';
import { TodayReflectionCard, ReflectionCards } from "@/components/basket";
import { DocumentsList } from '@/components/documents/DocumentsList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SubpageHeader } from '@/components/basket/SubpageHeader';
import { PenTool, FileText } from 'lucide-react';
import AddMemoryModal from '@/components/memory/AddMemoryModal';

interface Props {
  basketId: string;
  pattern?: string;
  tension?: string | null;
  question?: string;
  fallback: string;
}

export default function MemoryClient({ basketId, pattern, tension, question, fallback }: Props) {
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);

  const refreshDocuments = () => {
    // This will trigger DocumentsList to refresh
    window.location.reload();
  };

  const handleCreateDocument = async () => {
    setIsCreatingDocument(true);
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basket_id: basketId,
          title: 'Untitled Document',
          metadata: {
            created_via: 'memory_page'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create document');
      }

      const { document_id } = await response.json();
      
      // Navigate to the new document
      window.location.href = `/baskets/${basketId}/documents/${document_id}`;
      
    } catch (error) {
      console.error('Document creation failed:', error);
      alert('Failed to create document. Please try again.');
    } finally {
      setIsCreatingDocument(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <SubpageHeader
        title="Your Memory"
        basketId={basketId}
        description="Capture thoughts and create documents to organize your knowledge"
        rightContent={
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowAddMemory(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <PenTool className="h-4 w-4" />
              Add Memory
            </Button>
            <Button
              onClick={handleCreateDocument}
              disabled={isCreatingDocument}
              size="sm"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <FileText className="h-4 w-4" />
              {isCreatingDocument ? 'Creating...' : 'Create Document'}
            </Button>
          </div>
        }
      />
      
      <TodayReflectionCard line={undefined} fallback={fallback} />
      
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Documents */}
        <div className="col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Documents & Files</CardTitle>
              <p className="text-sm text-gray-600">Your uploaded documents and files</p>
            </CardHeader>
            <CardContent>
              <DocumentsList basketId={basketId} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Insights */}
        <div className="col-span-4">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Memory Insights</CardTitle>
              <p className="text-sm text-gray-600">Patterns discovered in your memory</p>
            </CardHeader>
            <CardContent>
              <ReflectionCards pattern={pattern} tension={tension} question={question || null} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <AddMemoryModal
        basketId={basketId}
        open={showAddMemory}
        onClose={() => setShowAddMemory(false)}
        onSuccess={() => setShowAddMemory(false)}
      />
    </div>
  );
}

