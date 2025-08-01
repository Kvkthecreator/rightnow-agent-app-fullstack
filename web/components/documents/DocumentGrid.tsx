"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  FileText, 
  MoreVertical, 
  Edit3,
  Share,
  Archive,
  Copy,
  Download
} from "lucide-react";

import type { Document } from "@/types";

interface DocumentGridProps {
  documents: Document[];
  onDocumentClick: (document: Document) => void;
  onDocumentAction: (document: Document, action: string) => void;
}

export function DocumentGrid({ documents, onDocumentClick, onDocumentAction }: DocumentGridProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const formatDate = (dateString: string | undefined) => {
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

  const getPreview = (content: string | undefined, maxLength: number = 150) => {
    if (!content) return '';
    const preview = content.replace(/[#*>`\-]/g, '').trim();
    return preview.length > maxLength 
      ? preview.substring(0, maxLength) + '...'
      : preview;
  };

  const handleMenuToggle = (documentId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveMenu(activeMenu === documentId ? null : documentId);
  };

  const handleAction = (document: Document, action: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onDocumentAction(document, action);
    setActiveMenu(null);
  };

  return (
    <div className="document-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documents.map(document => (
        <Card 
          key={document.id}
          className="document-card hover:shadow-md transition-shadow cursor-pointer group relative"
          onClick={() => onDocumentClick(document)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <h3 className="font-medium text-gray-900 truncate">
                  {document.title}
                </h3>
              </div>
              
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                  onClick={(e) => handleMenuToggle(document.id, e)}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
                
                {/* Simple dropdown menu */}
                {activeMenu === document.id && (
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-10 min-w-32">
                    <button
                      onClick={(e) => handleAction(document, 'edit', e)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => handleAction(document, 'duplicate', e)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </button>
                    <button
                      onClick={(e) => handleAction(document, 'share', e)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Share className="h-4 w-4" />
                      Share
                    </button>
                    <button
                      onClick={(e) => handleAction(document, 'export', e)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </button>
                    <button
                      onClick={(e) => handleAction(document, 'archive', e)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Archive className="h-4 w-4" />
                      Archive
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Document Preview */}
            <p className="text-sm text-gray-600 mb-4 leading-relaxed line-clamp-3">
              {getPreview(document.content_raw) || "No content yet..."}
            </p>

            {/* Document Metadata */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{formatDate(document.updated_at)}</span>
              <Badge variant="outline" className="text-xs">
                {(document.content_raw ? document.content_raw.split(/\s+/).filter(word => word.length > 0).length : 0).toLocaleString()} words
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Click outside to close menu */}
      {activeMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  );
}