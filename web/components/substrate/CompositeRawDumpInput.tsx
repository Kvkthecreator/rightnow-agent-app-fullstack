// TRUE CONTEXT OS - Composite Raw Dump Input
// Like Claude: text + attachments = ONE semantic unit

"use client";

import React, { useState, useRef } from 'react';
import { X, Paperclip, FileText, Image, File } from 'lucide-react';
import { getFragmentType, type Fragment, type CompositeInput } from '@/lib/substrate/FragmentTypes';

interface CompositeRawDumpInputProps {
  onSubmit: (fragments: Fragment[]) => Promise<void>;
  className?: string;
}

export function CompositeRawDumpInput({ onSubmit, className = "" }: CompositeRawDumpInputProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const type = getFragmentType(file);
      return type !== null;
    });
    
    setAttachments(prev => [...prev, ...validFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!text.trim() && attachments.length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      const fragments: Fragment[] = [];
      let position = 0;
      
      // Add text fragment if present
      if (text.trim()) {
        fragments.push({
          id: `fragment-${Date.now()}-${position}`,
          type: text.length > 1000 ? 'text-dump' : 'text',
          content: text,
          position: position++,
          metadata: {
            processing: 'complete'
          }
        });
      }
      
      // Add file fragments
      for (const file of attachments) {
        fragments.push({
          id: `fragment-${Date.now()}-${position}`,
          type: getFragmentType(file),
          content: file, // Will be processed by handler
          position: position++,
          metadata: {
            filename: file.name,
            mimeType: file.type,
            size: file.size,
            processing: 'pending'
          }
        });
      }
      
      await onSubmit(fragments);
      
      // Clear inputs after successful submission
      setText('');
      setAttachments([]);
      
    } catch (error) {
      console.error('Failed to submit composite raw dump:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileIcon = (file: File) => {
    const type = getFragmentType(file);
    switch (type) {
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  const hasContent = text.trim() || attachments.length > 0;

  return (
    <div className={`border rounded-lg bg-white ${className}`}>
      {/* Main input area */}
      <div className="p-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your thoughts, paste content, or add files..."
          className="w-full min-h-[120px] resize-none border-0 outline-none text-sm"
          disabled={isSubmitting}
        />
        
        {/* Attachment preview */}
        {attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            {attachments.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-md text-sm"
              >
                {getFileIcon(file)}
                <span className="flex-1 truncate">{file.name}</span>
                <span className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)}KB
                </span>
                <button
                  onClick={() => handleRemoveAttachment(index)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Action bar */}
      <div className="border-t px-4 py-3 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.pdf,.png,.jpg,.jpeg"
            onChange={handleAddAttachment}
            className="hidden"
            id="composite-file-input"
            disabled={isSubmitting}
          />
          <label 
            htmlFor="composite-file-input"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 cursor-pointer transition-colors"
          >
            <Paperclip className="w-4 h-4" />
            Attach files
          </label>
          
          <span className="text-xs text-gray-500">
            Supports: Text, PDF, Images
          </span>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!hasContent || isSubmitting}
          className={`
            px-4 py-2 text-sm font-medium rounded-md transition-all
            ${hasContent && !isSubmitting
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            'Add to Research'
          )}
        </button>
      </div>
      
      {/* Context hint */}
      <div className="px-4 pb-3">
        <p className="text-xs text-gray-500">
          💡 Everything you add here will be interpreted together as one unified context
        </p>
      </div>
    </div>
  );
}