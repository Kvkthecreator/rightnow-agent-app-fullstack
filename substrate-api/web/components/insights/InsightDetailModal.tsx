"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { X, ExternalLink, Sparkles } from 'lucide-react';
import InsightCanonCard from './InsightCanonCard';

interface InsightDetailModalProps {
  basketId: string;
  open: boolean;
  onClose: () => void;
}

export default function InsightDetailModal({
  basketId,
  open,
  onClose
}: InsightDetailModalProps) {
  const router = useRouter();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Insight Canon</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => router.push(`/baskets/${basketId}/insights`)}
              variant="ghost"
              size="sm"
              className="text-purple-600 hover:text-purple-700"
            >
              <ExternalLink className="h-4 w-4 mr-1.5" />
              <span className="text-sm">Open Full Page</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              title="Close modal (or click outside)"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <InsightCanonCard
            basketId={basketId}
            compact={false}
            onInsightGenerated={() => {
              // No action needed - card handles its own state
            }}
          />
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
