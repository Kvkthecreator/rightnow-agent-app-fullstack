"use client";

import { useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { ContentInput } from '@/lib/intelligence/useUniversalIntelligence';

interface UniversalContentInputProps {
  inputs: ContentInput[];
  onInputsChange: (inputs: ContentInput[]) => void;
  disabled?: boolean;
  className?: string;
}

export default function UniversalContentInput({
  inputs,
  onInputsChange,
  disabled = false,
  className
}: UniversalContentInputProps) {
  const [dragActive, setDragActive] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = useCallback(async (fileList: FileList) => {
    const files = Array.from(fileList);
    const newInputs: ContentInput[] = [];

    for (const file of files) {
      try {
        const content = await readFile(file);
        newInputs.push({
          type: 'file',
          content,
          metadata: {
            filename: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
          }
        });
      } catch (error) {
        console.error(`Failed to read file ${file.name}:`, error);
      }
    }

    if (newInputs.length > 0) {
      onInputsChange([...inputs, ...newInputs]);
    }
  }, [inputs, onInputsChange]);

  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsText(file);
    });
  };

  const handleTextSubmit = () => {
    if (textContent.trim()) {
      const newInput: ContentInput = {
        type: 'text',
        content: textContent.trim(),
        metadata: {
          length: textContent.length,
          added_at: new Date().toISOString()
        }
      };
      onInputsChange([...inputs, newInput]);
      setTextContent('');
    }
  };

  const handleUrlSubmit = async () => {
    if (urlInput.trim()) {
      // For demo purposes, we'll just add the URL as text content
      // In a real implementation, you'd fetch the URL content
      const newInput: ContentInput = {
        type: 'url',
        content: `Content from: ${urlInput.trim()}\n\n[URL content would be fetched here]`,
        metadata: {
          url: urlInput.trim(),
          added_at: new Date().toISOString()
        }
      };
      onInputsChange([...inputs, newInput]);
      setUrlInput('');
    }
  };

  const removeInput = (indexToRemove: number) => {
    onInputsChange(inputs.filter((_, index) => index !== indexToRemove));
  };

  const getInputIcon = (type: string) => {
    switch (type) {
      case 'file': return '📄';
      case 'url': return '🔗';
      case 'text': return '📝';
      default: return '📋';
    }
  };

  const getInputTypeColor = (type: string) => {
    switch (type) {
      case 'file': return 'bg-blue-100 text-blue-800';
      case 'url': return 'bg-green-100 text-green-800';
      case 'text': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* File Drop Zone */}
      <Card className={cn(
        "border-2 border-dashed transition-colors cursor-pointer",
        dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}>
        <CardContent 
          className="text-center py-8"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <div className="text-4xl mb-2">📁</div>
          <h3 className="font-medium text-sm mb-1">Drop files here or click to browse</h3>
          <p className="text-xs text-muted-foreground">
            Supports text files, documents, and more
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            disabled={disabled}
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            accept=".txt,.md,.pdf,.doc,.docx"
          />
        </CardContent>
      </Card>

      {/* Text Input */}
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">📝</span>
            <h3 className="font-medium text-sm">Add text content</h3>
          </div>
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            disabled={disabled}
            placeholder="Paste your content here... (project notes, business requirements, ideas, etc.)"
            className="w-full min-h-[100px] p-3 border border-input rounded-lg text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {textContent.length} characters
            </span>
            <Button 
              onClick={handleTextSubmit}
              disabled={disabled || !textContent.trim()}
              size="sm"
            >
              Add Text
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* URL Input */}
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🔗</span>
            <h3 className="font-medium text-sm">Import from URL</h3>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={disabled}
              placeholder="https://example.com/document"
              className="flex-1 p-2 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
            <Button 
              onClick={handleUrlSubmit}
              disabled={disabled || !urlInput.trim()}
              size="sm"
            >
              Import
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Import content from web pages, documents, or other online sources
          </p>
        </CardContent>
      </Card>

      {/* Current Inputs Display */}
      {inputs.length > 0 && (
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Added Content</h3>
              <Badge variant="outline" className="text-xs">
                {inputs.length} {inputs.length === 1 ? 'item' : 'items'}
              </Badge>
            </div>
            <div className="space-y-2">
              {inputs.map((input, index) => (
                <div key={index} className="flex items-center gap-3 p-2 border border-border rounded-lg bg-muted/20">
                  <span className="text-base">{getInputIcon(input.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs px-1.5 py-0.5", getInputTypeColor(input.type))}
                      >
                        {input.type}
                      </Badge>
                      {input.metadata?.filename && (
                        <span className="text-xs text-muted-foreground truncate">
                          {input.metadata.filename}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {input.content.length > 100 
                        ? input.content.substring(0, 100) + '...'
                        : input.content
                      }
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    onClick={() => removeInput(index)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}