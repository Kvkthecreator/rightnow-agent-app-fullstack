"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  ArrowLeft, 
  BarChart3, 
  Clock, 
  FileText, 
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Search
} from "lucide-react";

import type { Document } from "@/types";

interface BasketNavigationHubProps {
  basketId: string;
  basketName: string;
  documents: Document[];
  currentView: 'dashboard' | 'documents' | 'timeline' | 'detailed-view';
  activeDocumentId?: string;
  onCreateDocument: () => void;
}

export function BasketNavigationHub({
  basketId,
  basketName,
  documents,
  currentView,
  activeDocumentId,
  onCreateDocument
}: BasketNavigationHubProps) {
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Clean navigation routing using the new structure
  const navigateToView = (view: 'dashboard' | 'documents' | 'timeline' | 'detailed-view', documentId?: string) => {
    if (view === 'dashboard') {
      router.push(`/baskets/${basketId}/work`);
    } else if (view === 'documents' && documentId) {
      router.push(`/baskets/${basketId}/work/documents/${documentId}`);
    } else if (view === 'documents') {
      router.push(`/baskets/${basketId}/work/documents`);
    } else if (view === 'timeline') {
      router.push(`/baskets/${basketId}/work/timeline`);
    } else if (view === 'detailed-view') {
      router.push(`/baskets/${basketId}/work/detailed-view`);
    }
  };

  // Handle document creation with clean routing
  const handleCreateDocument = () => {
    router.push(`/baskets/${basketId}/work/documents/new`);
  };

  // Collapsed state
  if (!sidebarVisible) {
    return (
      <div className="fixed top-4 left-4 z-50">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setSidebarVisible(true)}
          className="shadow-lg"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <nav className="basket-navigation-hub w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* General Navigation */}
      <div className="general-navigation p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/baskets')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-gray-900">yarnnn</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setSidebarVisible(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Basket Header */}
      <div className="basket-header p-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900 text-lg truncate">
          {basketName}
        </h2>
        <p className="text-sm text-gray-500">Project Workspace</p>
      </div>

      {/* Main Navigation */}
      <div className="main-navigation p-4 border-b border-gray-100">
        <div className="space-y-1">
          <NavigationItem
            icon={<BarChart3 className="h-4 w-4" />}
            label="Dashboard"
            active={currentView === 'dashboard'}
            onClick={() => navigateToView('dashboard')}
          />
          <NavigationItem
            icon={<Search className="h-4 w-4" />}
            label="Detailed View"
            active={currentView === 'detailed-view'}
            onClick={() => navigateToView('detailed-view')}
            badge="Debug"
          />
          <NavigationItem
            icon={<Clock className="h-4 w-4" />}
            label="Timeline"
            active={currentView === 'timeline'}
            disabled={false}
            badge="Phase 2"
            onClick={() => navigateToView('timeline')}
          />
        </div>
      </div>

      {/* Documents Section */}
      <div className="documents-section flex-1 flex flex-col min-h-0">
        <div className="documents-header p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Documents</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleCreateDocument}
              className="text-gray-500 hover:text-gray-700"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="documents-list flex-1 overflow-auto">
          {documents.length === 0 ? (
            <div className="p-4 text-center">
              <div className="text-gray-400 mb-3">
                <FileText className="h-8 w-8 mx-auto mb-2" />
              </div>
              <p className="text-sm text-gray-500 mb-3">No documents yet</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCreateDocument}
              >
                Create First Document
              </Button>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {documents.map(doc => (
                <DocumentItem
                  key={doc.id}
                  document={doc}
                  active={activeDocumentId === doc.id}
                  onClick={() => navigateToView('documents', doc.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

// Supporting Components
interface NavigationItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  badge?: string;
  onClick: () => void;
}

function NavigationItem({ icon, label, active, disabled, badge, onClick }: NavigationItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
        ${active 
          ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200' 
          : disabled
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        }
      `}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <Badge variant="outline" className="text-xs">
          {badge}
        </Badge>
      )}
    </button>
  );
}

interface DocumentItemProps {
  document: Document;
  active: boolean;
  onClick: () => void;
}

function DocumentItem({ document, active, onClick }: DocumentItemProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Calculate word count from content if available
  const getWordCount = (content?: string) => {
    if (!content) return 0;
    return content.split(/\s+/).filter(word => word.length > 0).length;
  };

  const wordCount = getWordCount(document.content_raw);

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all
        ${active 
          ? 'bg-blue-50 border border-blue-200 shadow-sm' 
          : 'hover:bg-gray-50 border border-transparent'
        }
      `}
    >
      <FileText className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
        active ? 'text-blue-600' : 'text-gray-400'
      }`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${
          active ? 'text-blue-900' : 'text-gray-900'
        }`}>
          {document.title || 'Untitled Document'}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-gray-500">
            {formatDate(document.updated_at)}
          </p>
          {wordCount > 0 && (
            <>
              <span className="text-xs text-gray-300">•</span>
              <p className="text-xs text-gray-400">
                {wordCount.toLocaleString()} words
              </p>
            </>
          )}
        </div>
      </div>
    </button>
  );
}