"use client";
import { useState, useRef, useEffect } from "react";
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered,
  Quote,
  Link,
  Image,
  Code,
  Heading1,
  Heading2
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface LiveDocumentEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  basketId: string;
  documentId: string;
}

export function LiveDocumentEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  basketId,
  documentId
}: LiveDocumentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isToolbarActive, setIsToolbarActive] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [content]);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newContent = 
      content.substring(0, start) + 
      before + selectedText + after + 
      content.substring(end);
    
    onChange(newContent);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const toolbarActions = [
    { icon: Heading1, action: () => insertText('\n# ', ''), title: 'Heading 1' },
    { icon: Heading2, action: () => insertText('\n## ', ''), title: 'Heading 2' },
    { icon: Bold, action: () => insertText('**', '**'), title: 'Bold' },
    { icon: Italic, action: () => insertText('*', '*'), title: 'Italic' },
    { icon: List, action: () => insertText('\n- ', ''), title: 'Bullet List' },
    { icon: ListOrdered, action: () => insertText('\n1. ', ''), title: 'Numbered List' },
    { icon: Quote, action: () => insertText('\n> ', ''), title: 'Quote' },
    { icon: Link, action: () => insertText('[', '](url)'), title: 'Link' },
    { icon: Image, action: () => insertText('![', '](image-url)'), title: 'Image' },
    { icon: Code, action: () => insertText('`', '`'), title: 'Code' },
  ];

  const handleFocus = () => {
    setIsToolbarActive(true);
    setShowToolbar(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsToolbarActive(false);
      setShowToolbar(false);
    }, 200);
  };

  return (
    <div className="live-document-editor w-full">
      {/* Formatting Toolbar */}
      {showToolbar && (
        <div className="editor-toolbar flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
          <div className="flex items-center gap-1">
            {toolbarActions.map((tool, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={tool.action}
                title={tool.title}
                className="h-8 w-8 p-0 hover:bg-white"
              >
                <tool.icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
          <div className="ml-auto text-xs text-gray-500">
            Use Markdown formatting
          </div>
        </div>
      )}

      {/* Main Editor */}
      <div className="editor-main relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full min-h-96 p-6 border-none resize-none focus:outline-none text-gray-900 leading-relaxed text-lg bg-white"
          style={{
            fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
            lineHeight: '1.7'
          }}
        />
        
        {/* Writing Assistance Hints */}
        {content.length === 0 && (
          <div className="absolute top-20 left-6 text-gray-400 pointer-events-none">
            <p className="text-lg mb-2">💡 Writing tips:</p>
            <ul className="text-sm space-y-1 ml-4">
              <li>• Use **bold** for emphasis</li>
              <li>• Start lines with - for bullet points</li>
              <li>• Use &gt; for quotes</li>
              <li>• # for headings</li>
              <li>• AI writing assistance will appear in the right panel</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}