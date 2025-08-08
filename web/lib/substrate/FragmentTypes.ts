// TRUE CONTEXT OS - Fragment Types for Unified Raw Dumps
// Fragments compose into a single semantic unit

export type FragmentType = 'text' | 'text-dump' | 'pdf' | 'image';

export interface Fragment {
  id: string;
  type: FragmentType;
  content: string | ArrayBuffer | Blob;
  position: number; // Order matters for interpretation
  metadata: {
    filename?: string;
    mimeType?: string;
    size?: number;
    pageCount?: number; // for PDFs
    dimensions?: { width: number; height: number }; // for images
    processing: 'pending' | 'processing' | 'complete' | 'error';
    extractedText?: string; // for PDFs/images after OCR
  };
}

export interface UnifiedRawDump {
  id: string;
  basketId: string;
  workspaceId: string;
  fragments: Fragment[];
  context: 'unified'; // All fragments interpreted together
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    totalFragments: number;
    hasText: boolean;
    hasFiles: boolean;
    processingStatus: 'pending' | 'processing' | 'complete' | 'partial';
  };
}

export interface CompositeInput {
  text: string;
  attachments: File[];
  basketId: string;
  workspaceId: string;
}

// Helper to determine fragment type from file
export function getFragmentType(file: File): FragmentType {
  const mimeTypeMap: Record<string, FragmentType> = {
    'text/plain': 'text-dump',
    'application/pdf': 'pdf',
    'image/png': 'image',
    'image/jpeg': 'image',
    'image/jpg': 'image'
  };
  
  return mimeTypeMap[file.type] || 'text-dump';
}

// Helper to check if content should be treated as text-dump
export function isTextDump(content: string): boolean {
  return content.length > 1000 || content.split('\n').length > 20;
}