"use client";

import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!open) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Document Upload Path (Canon v1.4.0): Document Creation → File Processing
      const createResponse = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basket_id: basketId,
          title: selectedFile.name,
          metadata: {
            original_filename: selectedFile.name,
            file_size: selectedFile.size,
            file_type: selectedFile.type
          }
        })
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        console.error('Document creation failed:', errorData);
        throw new Error(errorData.error || 'Failed to create document');
      }

      const { document_id } = await createResponse.json();

      // Link to raw_dump via file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('document_id', document_id);
      formData.append('dump_request_id', crypto.randomUUID());

      const uploadResponse = await fetch('/api/dumps/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        console.error('File upload failed:', errorData);
        throw new Error(errorData.error || 'Failed to upload file');
      }

      onSuccess();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        
        {/* Header */}
        <div className="border-b p-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Upload Document</h3>
            <p className="text-sm text-gray-600">Add files to your memory</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            
            {selectedFile ? (
              <div className="space-y-2">
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Supports PDF, images, and text files
                </p>
                <p className="text-xs text-gray-500">
                  .pdf, .jpg, .jpeg, .png, .gif, .txt, .md, .doc, .docx
                </p>
              </div>
            )}

            <input
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              id="document-upload"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.txt,.md,.doc,.docx"
            />
            
            <label 
              htmlFor="document-upload"
              className="inline-block mt-4 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
            >
              {selectedFile ? 'Choose Different File' : 'Choose File'}
            </label>
          </div>

          {selectedFile && (
            <div className="mt-6 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setSelectedFile(null)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}