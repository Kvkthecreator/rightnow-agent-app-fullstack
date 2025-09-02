"use client";

import { useState } from 'react';
import { TodayReflectionCard, ReflectionCards, AddMemoryComposer } from "@/components/basket";
import { DocumentsList } from '@/components/documents/DocumentsList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Upload, FileText, Plus, Sparkles } from 'lucide-react';
import DocumentUploadModal from '@/components/documents/DocumentUploadModal';

interface Props {
  basketId: string;
  pattern?: string;
  tension?: string | null;
  question?: string;
  fallback: string;
}

export default function MemoryClient({ basketId, pattern, tension, question, fallback }: Props) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewMode, setViewMode] = useState<'capture' | 'documents'>('capture');

  return (
    <div className="space-y-8">
      {/* Today's Reflection */}
      <TodayReflectionCard line={undefined} fallback={fallback} />
      
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column - Main Actions */}
        <div className="col-span-8 space-y-6">
          
          {/* Mode Toggle */}
          <div className="flex items-center justify-center">
            <div className="inline-flex bg-gray-100 rounded-lg p-1">
              <button
                className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'capture' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setViewMode('capture')}
              >
                Quick Capture
              </button>
              <button
                className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'documents' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setViewMode('documents')}
              >
                Document Library
              </button>
            </div>
          </div>

          {viewMode === 'capture' ? (
            /* Quick Capture View */
            <div className="space-y-6">
              {/* Text Capture */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    Add a Quick Memory
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Jot down thoughts, ideas, or observations for your memory to process
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AddMemoryComposer basketId={basketId} />
                </CardContent>
              </Card>

              {/* Document Upload */}
              <Card className="border-2 border-dashed border-blue-200 bg-blue-50">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Documents</h3>
                  <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
                    Add your existing documents, PDFs, notes, or files. You can request breakdown into organized knowledge after upload.
                  </p>
                  <Button 
                    onClick={() => setShowUploadModal(true)}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Document Library View */
            <div className="space-y-6">
              {/* Document Library Header */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Your Document Library
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Manage uploaded documents and request breakdowns into organized knowledge
                      </p>
                    </div>
                    <Button 
                      onClick={() => setShowUploadModal(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Documents List */}
              <DocumentsList basketId={basketId} />
            </div>
          )}
        </div>

        {/* Right Column - Insights */}
        <div className="col-span-4">
          <div className="sticky top-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Memory Insights</CardTitle>
                <p className="text-sm text-gray-600">
                  Patterns and connections discovered in your memory
                </p>
              </CardHeader>
              <CardContent>
                <ReflectionCards pattern={pattern} tension={tension} question={question || null} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <DocumentUploadModal
        basketId={basketId}
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          setShowUploadModal(false);
          setViewMode('documents');
        }}
      />
    </div>
  );
}

