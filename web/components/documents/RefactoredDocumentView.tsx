"use client";

import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { UnifiedDocumentEditor } from './UnifiedDocumentEditor';
import { YarnnnThinkingPartner } from '@/components/thinking/YarnnnThinkingPartner';
import { YarnnnInsightApproval } from '@/components/thinking/YarnnnInsightApproval';
import { SimpleConnectionStatus, SimpleToast } from '@/components/ui/SimpleConnectionStatus';
import { useBasketDocuments } from '@/lib/hooks/useBasketDocuments';
import { useUniversalChanges } from '@/lib/hooks/useUniversalChanges';
import { useSubstrate } from '@/lib/substrate/useSubstrate';
import { analyzeConversationIntent } from '@/lib/intelligence/conversationAnalyzer';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';

interface RefactoredDocumentViewProps {
  basketId: string;
  basketName: string;
  documentId: string;
}

export function RefactoredDocumentView({ 
  basketId, 
  basketName, 
  documentId 
}: RefactoredDocumentViewProps) {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  
  // Document management
  const { documents, isLoading, updateDocument } = useBasketDocuments(basketId);
  const activeDocument = documents.find((doc: any) => doc.id === documentId);
  
  // Universal changes for the companion workflow
  const changeManager = useUniversalChanges(basketId);
  
  // Substrate intelligence for document context
  const workspaceId = useWorkspaceId(basketId);
  const substrate = useSubstrate(basketId, workspaceId || 'default');
  
  // Initialize document data
  useEffect(() => {
    if (activeDocument) {
      setDocumentTitle(activeDocument.title);
      setDocumentContent(activeDocument.content_raw || '');
    }
  }, [activeDocument]);

  // Handle document-aware thought capture
  const handleDocumentThoughtCapture = async (capturedContent: any) => {
    try {
      if (capturedContent.type === 'conversation') {
        const intent = capturedContent.intent;
        
        // Enhanced context for document-specific interactions
        const documentContext = {
          documentId,
          documentTitle,
          currentContent: documentContent,
          selectedText: window.getSelection()?.toString() || '',
          cursorPosition: 0, // Could be enhanced to track actual cursor position
        };

        if (intent.shouldGenerateIntelligence) {
          // Generate intelligence with document context
          await changeManager.generateIntelligence({
            userInput: capturedContent.content,
            timestamp: capturedContent.timestamp,
            intent,
            documentContext
          }, 'document');
        } else {
          // Add context with document awareness
          await changeManager.addContext([{
            type: 'document_interaction',
            content: capturedContent.content,
            metadata: { 
              timestamp: capturedContent.timestamp,
              documentId,
              documentTitle,
              interactionType: intent.type,
              selectedText: documentContext.selectedText
            }
          }]);
          
          // Show document-specific feedback
          if (intent.type === 'document_expansion') {
            setToast({ message: 'I\'ll help expand this section based on your substrate patterns', type: 'info' });
          } else if (intent.type === 'connection_request') {
            setToast({ message: 'Looking for connections to your other research', type: 'info' });
          } else {
            setToast({ message: 'I\'m thinking about this with you', type: 'success' });
          }
          
          setTimeout(() => setToast(null), 4000);
        }
        
      } else if (capturedContent.type === 'file') {
        // Handle file upload in document context
        const formData = new FormData();
        formData.append('basketId', basketId);
        formData.append('documentId', documentId);
        formData.append('files', capturedContent.file);
        
        console.log('✅ Step 1: DocumentDTO file upload via Universal Changes pipeline');
        
        // Use Universal Changes pipeline for file uploads
        await changeManager.submitChange('context_add', {
          content: [{
            type: 'file',
            content: '', // File content will be processed by the service
            metadata: { 
              file: capturedContent.file,
              basketId,
              documentId,
              source: 'document_file_upload'
            }
          }],
          triggerIntelligenceRefresh: true
        });
        
        console.log('✅ Step 2: DocumentDTO file upload submitted through pipeline');
        setToast({ message: 'File processed through Universal Changes pipeline', type: 'success' });
        setTimeout(() => setToast(null), 4000);
        
      } else if (capturedContent.type === 'generate') {
        // Generate document-specific insights
        await changeManager.generateIntelligence({
          documentContext: {
            documentId,
            documentTitle,
            currentContent: documentContent,
            analysisType: 'document_focused'
          }
        });
      }
      
    } catch (error) {
      console.error('Failed to process document thought capture:', error);
      setToast({ message: 'Something went wrong while processing your thought', type: 'warning' });
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleTitleChange = async (newTitle: string) => {
    setDocumentTitle(newTitle);
    if (activeDocument && newTitle !== activeDocument.title) {
      await updateDocument(documentId, { title: newTitle });
    }
  };

  const handleContentChange = async (newContent: string) => {
    setDocumentContent(newContent);
    // Auto-save is handled by UnifiedDocumentEditor
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!activeDocument) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Document not found</h2>
          <p className="text-gray-600 mb-4">The document you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Simple Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-medium text-gray-900">
              {documentTitle || 'Untitled Document'}
            </h1>
            <SimpleConnectionStatus 
              isConnected={changeManager.isConnected}
            />
          </div>
        </div>
      </div>

      {/* Main Content - Single Column */}
      <div className="w-full">
        <div className="container mx-auto py-6 max-w-4xl px-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <UnifiedDocumentEditor
              documentId={documentId}
              basketId={basketId}
              initialContent={documentContent}
              title={documentTitle}
              onContentChange={handleContentChange}
              onTitleChange={handleTitleChange}
            />
          </div>
        </div>
      </div>

      {/* Substrate-Aware Thinking Partner */}
      <div className="fixed bottom-6 left-6 max-w-md">
        <YarnnnThinkingPartner
          basketId={basketId}
          workspaceId={workspaceId || 'default'}
          mode="substrate"
          onCapture={handleDocumentThoughtCapture}
          className="bg-white shadow-lg rounded-lg"
        />
      </div>

      {/* Document-Specific Insight Approval */}
      <YarnnnInsightApproval
        isOpen={changeManager.pendingChanges.length > 0}
        pendingChanges={changeManager.pendingChanges}
        changeManager={changeManager}
        context={{ 
          page: 'document',
          documentId: documentId
        }}
        onClose={() => {
          // Modal closes automatically when pendingChanges becomes empty
        }}
        currentIntelligence={null}
        isProcessing={changeManager.isProcessing}
      />

      {/* Toast notifications */}
      {toast && (
        <SimpleToast 
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}