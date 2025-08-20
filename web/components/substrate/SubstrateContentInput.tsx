import React, { useState } from 'react';
import type { ContentInput } from '@/lib/intelligence/useUniversalIntelligence';

interface SubstrateContentInputProps {
  onAddContext: (content: string, type: 'text' | 'file' | 'pdf' | 'image', files?: File[]) => Promise<void>;
  isVisible: boolean;
}

export function SubstrateContentInput({ onAddContext, isVisible }: SubstrateContentInputProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [textContent, setTextContent] = useState('');

  const handleTextSubmit = async () => {
    if (!textContent.trim() || isProcessing) return;
    
    setIsProcessing(true);
    try {
      await onAddContext(textContent.trim(), 'text');
      setTextContent('');
    } catch (error) {
      console.error('Failed to add context:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const file = files[0];
      let contentType: 'text' | 'file' | 'pdf' | 'image' = 'file';
      
      if (file.type === 'application/pdf') {
        contentType = 'pdf';
      } else if (file.type.startsWith('image/')) {
        contentType = 'image';
      }
      
      const content = `[File: ${file.name}]`;
      await onAddContext(content, contentType, [file]);
    } catch (error) {
      console.error('Failed to add file context:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="space-y-4">
      {/* Text Input */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">📝</span>
          <h3 className="font-medium text-sm">Add text content</h3>
        </div>
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          disabled={isProcessing}
          placeholder="Add context to expand your substrate intelligence..."
          className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-500">
            {textContent.length} characters
          </span>
          <button 
            onClick={handleTextSubmit}
            disabled={isProcessing || !textContent.trim()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Adding...' : 'Add Text'}
          </button>
        </div>
      </div>

      {/* File Upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <div className="text-4xl mb-2">📁</div>
        <h3 className="font-medium text-sm mb-1">Upload files</h3>
        <p className="text-xs text-gray-600 mb-4">
          Supports PDFs, images, and text files
        </p>
        <input
          type="file"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          disabled={isProcessing}
          className="hidden"
          id="file-upload"
          accept=".pdf,.jpg,.jpeg,.png,.gif,.txt,.md,.doc,.docx"
        />
        <label 
          htmlFor="file-upload"
          className="inline-block px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer disabled:opacity-50 transition-colors"
        >
          Choose File
        </label>
      </div>
      
      {isProcessing && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-3 text-blue-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm">Processing and integrating your content...</span>
          </div>
        </div>
      )}
    </div>
  );
}