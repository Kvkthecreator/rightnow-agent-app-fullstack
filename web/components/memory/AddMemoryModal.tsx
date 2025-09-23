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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 md:p-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl md:max-w-5xl">
        
        {/* Header */}
        <div className="border-b px-8 py-6 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">Capture a Thought</h3>
            <p className="text-sm text-gray-600">Add a thought to process into knowledge</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
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
