"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { Document } from "@/types";

interface DocumentEditorProps {
  basketId: string;
  document: Document;
  onDocumentUpdate: (document: Document) => void;
}

export default function DocumentEditor({
  basketId,
  document,
  onDocumentUpdate
}: DocumentEditorProps) {
  const [content, setContent] = useState(document.content_raw || "");
  const [title, setTitle] = useState(document.title);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save functionality (every 3 seconds after changes)
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (content !== document.content_raw || title !== document.title) {
        handleSave();
      }
    }, 3000);

    return () => clearTimeout(saveTimer);
  }, [content, title, document.content_raw, document.title]);

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content_raw: content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save document');
      }

      const { document: updatedDocument } = await response.json();
      
      onDocumentUpdate(updatedDocument);
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save document:", error);
      alert("Failed to save document. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save on Cmd+S / Ctrl+S
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Document Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📄</span>
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl font-semibold bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/20 rounded px-2 py-1 -ml-2"
                  placeholder="Document title..."
                />
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {document.document_type || 'general'}
                  </Badge>
                  {lastSaved && (
                    <span className="text-xs text-muted-foreground">
                      Saved {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                  {isSaving && (
                    <span className="text-xs text-muted-foreground">
                      Saving...
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Start writing your ${document.document_type || 'document'}...\n\nYou can use Markdown formatting:\n- **bold text**\n- *italic text*\n- # Headers\n- - Lists\n- [Links](url)`}
            className="w-full h-[600px] min-h-[600px] resize-none border-none outline-none text-base leading-relaxed font-mono bg-transparent focus:ring-0"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'
            }}
          />
        </div>
      </div>

      {/* Document Stats */}
      <div className="border-t bg-muted/20 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{content.length} characters</span>
            <span>{content.split(/\s+/).filter(Boolean).length} words</span>
            <span>{content.split('\n').length} lines</span>
          </div>
          <div className="flex items-center gap-2">
            <span>💡 Use AI assistance from the Brain panel →</span>
          </div>
        </div>
      </div>
    </div>
  );
}