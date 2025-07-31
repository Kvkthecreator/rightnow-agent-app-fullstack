"use client";

import { useState } from "react";
import { InsightCaptureModal } from "./InsightCaptureModal";
import { fetchWithToken } from "@/lib/fetchWithToken";

interface InsightCaptureModalWrapperProps {
  basketId: string;
  onClose: () => void;
  onInsightCaptured: () => void;
}

export function InsightCaptureModalWrapper({ 
  basketId, 
  onClose, 
  onInsightCaptured 
}: InsightCaptureModalWrapperProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleCapture = async (data: {
    type: string;
    title: string;
    content: string;
    discoveredByAI?: boolean;
    context?: string;
  }) => {
    try {
      // Call our existing insights API
      const response = await fetchWithToken(`/api/baskets/${basketId}/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: data.type,
          title: data.title,
          content: data.content,
          context: data.context,
          discoveredByAI: data.discoveredByAI || false,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to capture insight');
      }

      onInsightCaptured();
    } catch (error) {
      console.error('Error capturing insight:', error);
      throw error; // Re-throw to let InsightCaptureModal handle the error
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      onClose();
    }
  };

  return (
    <InsightCaptureModal
      open={isOpen}
      onOpenChange={handleOpenChange}
      onCapture={handleCapture}
      basketId={basketId}
      aiSuggestion={false}
    />
  );
}