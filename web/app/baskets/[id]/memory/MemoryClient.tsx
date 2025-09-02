"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { TodayReflectionCard, ReflectionCards, AddMemoryComposer } from "@/components/basket";
import { DocumentsList } from '@/components/documents/DocumentsList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Upload, FileText, Sparkles } from 'lucide-react';

interface Props {
  basketId: string;
  pattern?: string;
  tension?: string | null;
  question?: string;
  fallback: string;
}

export default function MemoryClient({ basketId, pattern, tension, question, fallback }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) return;
    
    setUploading(true);
    try {
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

      toast.success('Document uploaded ✓');
      setFile(null);
      setTitle('');
      router.push(`/baskets/${basketId}/documents/${document_id}`);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <TodayReflectionCard line={undefined} fallback={fallback} />
      
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Memory Actions */}
        <div className="col-span-8 space-y-6">
          
          {/* Text Capture */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Add Memory
              </CardTitle>
              <p className="text-sm text-gray-600">Quick capture thoughts and notes</p>
            </CardHeader>
            <CardContent>
              <AddMemoryComposer basketId={basketId} />
            </CardContent>
          </Card>

          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Upload Document
              </CardTitle>
              <p className="text-sm text-gray-600">Add existing documents, PDFs, or files</p>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {!file ? (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to choose file or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, TXT, MD, DOCX, images</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.txt,.md,.docx,.doc,.png,.jpg,.jpeg"
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-gray-600">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="doc-title">Document Title</Label>
                    <Input
                      id="doc-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter document title"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleUpload}
                    disabled={!title.trim() || uploading}
                    className="w-full"
                  >
                    {uploading ? 'Uploading...' : 'Upload Document'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Documents</CardTitle>
              <p className="text-sm text-gray-600">Your uploaded documents</p>
            </CardHeader>
            <CardContent>
              <DocumentsList basketId={basketId} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Insights */}
        <div className="col-span-4">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Memory Insights</CardTitle>
              <p className="text-sm text-gray-600">Patterns discovered in your memory</p>
            </CardHeader>
            <CardContent>
              <ReflectionCards pattern={pattern} tension={tension} question={question || null} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

