"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { 
  FileText, 
  Plus, 
  Search,
  Filter,
  MoreVertical,
  Edit3,
  Share,
  Download,
  Archive,
  ArrowLeft
} from "lucide-react";

// Import our document management hook
import { useBasketDocuments } from "@/lib/hooks/useBasketDocuments";

// Import document components
import { LiveDocumentEditor } from "@/components/documents/LiveDocumentEditor";
import { DocumentGrid } from "@/components/documents/DocumentGrid";
import { DocumentCreationModal } from "@/components/documents/DocumentCreationModal";
import { MarkdownDisplay } from "@/components/documents/MarkdownDisplay";

// Import substrate integration
import { useSubstrate } from "@/lib/substrate/useSubstrate";
import { SubstrateContentInput } from "@/components/substrate/SubstrateContentInput";
import { useWorkspaceId } from "@/hooks/useWorkspaceId";

interface DocumentsViewProps {
  basketId: string;
  basketName: string;
  documentId?: string; // When viewing/editing specific document
}

export function DocumentsView({ basketId, basketName, documentId }: DocumentsViewProps) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { documents, isLoading, createDocument, updateDocument } = useBasketDocuments(basketId);

  // Find active document if documentId provided
  const activeDocument = documentId ? documents.find(doc => doc.id === documentId) : null;

  const handleCreateDocument = async (title: string, template?: string) => {
    try {
      const newDoc = await createDocument(title, template || '');
      setShowCreateModal(false);
      // Navigate to the new document
      router.push(`/baskets/${basketId}/documents/${newDoc.id}`);
    } catch (error) {
      console.error('Failed to create document:', error);
    }
  };

  const handleDocumentSave = async (documentId: string, content: string, title?: string) => {
    try {
      await updateDocument(documentId, {
        content_raw: content,
        ...(title && { title }),
        updated_at: new Date().toISOString()
      } as any);
    } catch (error) {
      console.error('Failed to save document:', error);
    }
  };

  // If viewing specific document, show editor
  if (documentId && activeDocument) {
    return (
      <DocumentEditorView
        document={activeDocument}
        basketId={basketId}
        basketName={basketName}
        onSave={handleDocumentSave}
        onBack={() => router.push(`/baskets/${basketId}/documents`)}
      />
    );
  }

  // If creating new document, show creation flow
  if (documentId === 'new') {
    return (
      <DocumentCreationView
        basketId={basketId}
        basketName={basketName}
        onCancel={() => router.push(`/baskets/${basketId}/documents`)}
        onCreate={handleCreateDocument}
      />
    );
  }

  // Default: DocumentDTO management view
  return (
    <div className="documents-view h-full flex flex-col bg-gray-50">
      {/* Documents Header */}
      <div className="documents-header bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-600">Live editing workspace for {basketName}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Documents Content */}
      <div className="documents-content flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
              <p className="text-lg font-medium text-gray-900 mb-2">Loading your documents...</p>
              <p className="text-gray-600">Preparing your writing workspace</p>
            </div>
          </div>
        ) : documents.length === 0 ? (
          <DocumentsEmptyState 
            basketName={basketName}
            onCreateDocument={() => setShowCreateModal(true)}
          />
        ) : (
          <div className="p-6">
            <DocumentGrid
              documents={documents.filter(doc => 
                (doc.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (doc.content_raw || '').toLowerCase().includes(searchQuery.toLowerCase())
              )}
              onDocumentClick={(doc) => router.push(`/baskets/${basketId}/documents/${doc.id}`)}
              onDocumentAction={(doc, action) => handleDocumentAction(doc, action)}
            />
          </div>
        )}
      </div>

      {/* Document Creation Modal */}
      {showCreateModal && (
        <DocumentCreationModal
          basketName={basketName}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateDocument}
        />
      )}
    </div>
  );
}

// Document Editor View Component
interface DocumentEditorViewProps {
  document: any;
  basketId: string;
  basketName: string;
  onSave: (documentId: string, content: string, title?: string) => Promise<void>;
  onBack: () => void;
}

function DocumentEditorView({ 
  document, 
  basketId, 
  basketName, 
  onSave, 
  onBack 
}: DocumentEditorViewProps) {
  const [title, setTitle] = useState(document.title || '');
  const [content, setContent] = useState(document.content_raw || '');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showAddContext, setShowAddContext] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Add substrate integration
  const workspaceId = useWorkspaceId(basketId);
  const substrate = useSubstrate(basketId, workspaceId || 'default');

  // Handle adding context through substrate system
  const handleAddContext = async (contextContent: string, type: 'text' | 'file' | 'pdf' | 'image', files?: File[]): Promise<void> => {
    try {
      const substrateInput = [{
        type,
        content: contextContent,
        metadata: files && files.length > 0 ? {
          filename: files[0].name,
          size: files[0].size,
          fileObject: files[0]
        } : undefined
      }];
      
      await substrate.addTextRawDump(contextContent);
      await substrate.refreshSubstrate();
      
      // Optionally append context to current document content
      if (type === 'text') {
        const separator = content.length > 0 ? '\n\n---\n\n' : '';
        const updatedContent = content + separator + `**Added Context:**\n\n${contextContent}`;
        setContent(updatedContent);
      }
      
      setShowAddContext(false);
    } catch (error) {
      console.error('Failed to add context:', error);
    }
  };

  // Auto-save functionality
  useEffect(() => {
    const saveTimer = setTimeout(async () => {
      if (content !== document.content_raw || title !== document.title) {
        setIsSaving(true);
        try {
          await onSave(document.id, content, title);
          setLastSaved(new Date());
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsSaving(false);
        }
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(saveTimer);
  }, [content, title, document.id, document.content_raw, document.title, onSave]);

  const wordCount = content.split(/\s+/).filter((word: string) => word.length > 0).length;

  return (
    <div className="document-editor-view h-full flex flex-col bg-white">
      {/* Editor Header */}
      <div className="editor-header border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Documents
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                placeholder="Untitled Document"
              />
              <Badge variant="outline" className="text-sm">
                {wordCount.toLocaleString()} words
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isSaving ? (
              <span className="text-sm text-gray-500">Saving...</span>
            ) : lastSaved ? (
              <span className="text-sm text-gray-500">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            ) : null}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <FileText className="h-4 w-4 mr-2" />
              {showPreview ? 'Hide Preview' : 'Preview'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAddContext(!showAddContext)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Context
            </Button>
            <Button variant="outline" size="sm">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Live Editor */}
      <div className="editor-workspace flex-1 flex">
        <div className={`editor-main ${showPreview ? 'w-1/2' : 'flex-1'} p-6 ${showPreview ? 'border-r border-gray-200' : ''}`}>
          <LiveDocumentEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your strategic insights..."
            basketId={basketId}
            documentId={document.id}
          />
        </div>
        
        {/* Markdown Preview Panel */}
        {showPreview && (
          <div className="editor-preview w-1/2 p-6 bg-gray-50 overflow-auto">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview</h3>
              <p className="text-sm text-gray-600">
                Live preview of your markdown-formatted document
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm min-h-96">
              <MarkdownDisplay content={content} />
            </div>
          </div>
        )}
        
        {/* Add Context Panel */}
        {showAddContext && !showPreview && (
          <div className="editor-sidebar w-96 border-l border-gray-200 bg-gray-50 p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Context</h3>
              <p className="text-sm text-gray-600">
                Add content that will enhance your document and feed into your workspace intelligence.
              </p>
            </div>
            
            <SubstrateContentInput 
              onAddContext={handleAddContext}
              isVisible={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Document Creation View Component
interface DocumentCreationViewProps {
  basketId: string;
  basketName: string;
  onCancel: () => void;
  onCreate: (title: string, template?: string) => Promise<void>;
}

function DocumentCreationView({ basketId, basketName, onCancel, onCreate }: DocumentCreationViewProps) {
  const [title, setTitle] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const templates = [
    {
      id: 'blank',
      name: 'Blank Document',
      description: 'Start with a clean slate',
      content: ''
    },
    {
      id: 'strategic-analysis',
      name: 'Strategic Analysis',
      description: 'Framework for strategic thinking',
      content: `# Strategic Analysis

## Executive Summary
[Brief overview of the strategic situation]

## Current State Assessment
[Analysis of where things stand today]

## Strategic Options
[Different paths forward]

## Recommendations
[Preferred strategic direction]

## Next Steps
[Specific actions to take]
`
    },
    {
      id: 'project-plan',
      name: 'Project Planning',
      description: 'Structure for project organization',
      content: `# Project Plan

## Project Overview
[What we're building and why]

## Objectives
[Clear, measurable goals]

## Timeline & Milestones
[Key dates and deliverables]

## Resources Required
[People, tools, budget needed]

## Success Metrics
[How we'll measure progress]
`
    },
    {
      id: 'research-notes',
      name: 'Research Notes',
      description: 'Organize findings and insights',
      content: `# Research Notes

## Research Question
[What we're trying to understand]

## Key Findings
[Important discoveries and insights]

## Supporting Evidence
[Data, quotes, references]

## Implications
[What this means for our work]

## Next Research Steps
[What to investigate next]
`
    }
  ];

  const handleCreate = async () => {
    if (!title.trim()) return;
    
    setIsCreating(true);
    try {
      const template = templates.find(t => t.id === selectedTemplate);
      await onCreate(title, template?.content);
    } catch (error) {
      console.error('Failed to create document:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="document-creation-view h-full flex flex-col bg-gray-50">
      <div className="creation-header bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Document</h1>
            <p className="text-gray-600">Start writing in {basketName}</p>
          </div>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>

      <div className="creation-content flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Document Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              placeholder="Enter document title..."
              autoFocus
            />
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Choose a Template
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  selected={selectedTemplate === template.id}
                  onSelect={() => setSelectedTemplate(template.id)}
                />
              ))}
            </div>
          </div>

          {/* Create Button */}
          <div className="flex justify-end pt-6">
            <Button
              onClick={handleCreate}
              disabled={!title.trim() || isCreating}
              className="px-8"
            >
              {isCreating ? 'Creating...' : 'Create Document'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Supporting Components

function DocumentsEmptyState({ basketName, onCreateDocument }: { basketName: string; onCreateDocument: () => void }) {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center max-w-md">
        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-6" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No documents yet</h2>
        <p className="text-gray-600 mb-6">
          Start writing to develop your strategic thinking for {basketName}
        </p>
        <Button onClick={onCreateDocument} className="px-8">
          <Plus className="h-4 w-4 mr-2" />
          Create Your First Document
        </Button>
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    description: string;
    content: string;
  };
  selected: boolean;
  onSelect: () => void;
}

function TemplateCard({ template, selected, onSelect }: TemplateCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`p-4 rounded-lg border-2 text-left transition-all ${
        selected 
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <h3 className={`font-medium mb-2 ${selected ? 'text-blue-900' : 'text-gray-900'}`}>
        {template.name}
      </h3>
      <p className={`text-sm ${selected ? 'text-blue-700' : 'text-gray-600'}`}>
        {template.description}
      </p>
    </button>
  );
}

// Helper function for document actions
function handleDocumentAction(document: any, action: string) {
  switch (action) {
    case 'duplicate':
      console.log('Duplicating document:', document.title);
      break;
    case 'archive':
      console.log('Archiving document:', document.title);
      break;
    case 'share':
      console.log('Sharing document:', document.title);
      break;
    case 'export':
      console.log('Exporting document:', document.title);
      break;
    default:
      console.log('Unknown action:', action);
  }
}