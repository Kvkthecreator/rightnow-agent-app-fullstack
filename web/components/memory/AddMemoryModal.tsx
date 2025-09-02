"use client";

import { AddMemoryComposer } from "@/components/basket";
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AddMemoryModalProps {
  basketId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMemoryModal({ 
  basketId, 
  open, 
  onClose, 
  onSuccess 
}: AddMemoryModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        
        {/* Header */}
        <div className="border-b p-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Add Memory</h3>
            <p className="text-sm text-gray-600">Capture thoughts, ideas, or observations</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <AddMemoryComposer 
            basketId={basketId} 
            onSuccess={(res) => {
              onSuccess();
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}