"use client";

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Upload, FileText, X } from 'lucide-react';

interface DocumentUploadModalProps {
  basketId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DocumentUploadModal({ 
  basketId, 
  open, 
  onClose, 
  onSuccess 
}: DocumentUploadModalProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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
      const selectedFile = e.dataTransfer.files[0];
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, "")); // Remove extension
      }
    }
  }, [title]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, "")); // Remove extension
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) return;
    
    setLoading(true);
    try {
      // Step 1: Create document record
      const createResponse = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basket_id: basketId,
          title: title.trim(),
          metadata: {
            original_filename: file.name,
            file_size: file.size,
            file_type: file.type
          }
        })
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create document');
      }

      const { document_id } = await createResponse.json();

      // Step 2: Upload file content (reusing existing raw_dump infrastructure)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_id', document_id);
      formData.append('dump_request_id', crypto.randomUUID());

      const uploadResponse = await fetch(`/api/dumps/upload`, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      toast.success('Document uploaded successfully ✓');
      
      // Reset state
      setFile(null);
      setTitle('');
      onSuccess();
      
      // Navigate to document view
      router.push(`/baskets/${basketId}/documents/${document_id}`);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setTitle('');
    setDragActive(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        
        {/* Header */}
        <div className="border-b p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Upload className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Upload Document</h3>
              <p className="text-sm text-gray-600">Add existing documents to your memory</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : file 
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-blue-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-3">
                <FileText className="h-12 w-12 text-green-600 mx-auto" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown type'}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFile(null)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Choose Different File
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="font-medium text-gray-900">Drop your document here</p>
                  <p className="text-sm text-gray-600">or click to browse files</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Supports PDF, TXT, MD, DOCX, and images
                  </p>
                </div>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.txt,.md,.docx,.doc,.png,.jpg,.jpeg"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Document Title */}
          <div className="space-y-2">
            <Label htmlFor="document-title" className="font-medium">
              Document Title
            </Label>
            <Input
              id="document-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for this document"
              className="text-sm"
            />
            <p className="text-xs text-gray-500">
              This will help you find and organize your document later
            </p>
          </div>

          {/* Upload Info */}
          {file && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">What happens next:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Document will be uploaded and stored in your memory</li>
                  <li>• You'll be able to view the document immediately</li>
                  <li>• From the document page, you can request breakdown into organized knowledge</li>
                  <li>• Breakdown requests go through your governance settings for approval</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex items-center justify-between">
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload}
            disabled={!file || !title.trim() || loading}
          >
            {loading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>

      </div>
    </div>
  );
}