"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { notificationService } from '@/lib/notifications/service';
import { Database } from 'lucide-react';

interface CreateBlockModalProps {
  basketId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateBlockModal({ basketId, open, onClose, onSuccess }: CreateBlockModalProps) {
  const [content, setContent] = useState('');
  const [semanticType, setSemanticType] = useState('');
  const [canonicalValue, setCanonicalValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      notificationService.notify({
        type: 'substrate.block.rejected',
        title: 'Validation Error',
        message: 'Content is required',
        severity: 'error'
      });
      return;
    }
    
    if (!semanticType.trim()) {
      notificationService.notify({
        type: 'substrate.block.rejected',
        title: 'Validation Error',
        message: 'Semantic type is required',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    
    try {
      // Route through universal work (governance-aware)
      const response = await fetch('/api/work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_type: 'MANUAL_EDIT',
          work_payload: {
            basket_id: basketId,
            operations: [{
              type: 'CreateBlock',
              data: {
                content: content.trim(),
                semantic_type: semanticType.trim(),
                canonical_value: canonicalValue.trim() || undefined,
                confidence: 0.9,
                scope: 'LOCAL'
              }
            }]
          },
          priority: 'normal'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create block');
      }

      const result = await response.json();
      
      if (result.execution_mode === 'auto_execute') {
        notificationService.substrateApproved(
          'Block Created',
          'New block added to your basket',
          result.created_ids,
          basketId
        );
      } else {
        notificationService.approvalRequired(
          'Block Pending Review',
          'Your block creation is awaiting approval',
          basketId
        );
      }

      // Reset form
      setContent('');
      setSemanticType('');
      setCanonicalValue('');
      onClose();
      onSuccess?.();

    } catch (error) {
      console.error('Block creation failed:', error);
      notificationService.substrateRejected(
        'Block Creation Failed',
        error instanceof Error ? error.message : 'Failed to create block',
        [],
        basketId
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-orange-600" />
            Create New Block
          </DialogTitle>
        </DialogHeader>
        
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter the block content..."
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="semantic-type">Semantic Type *</Label>
              <Input
                id="semantic-type"
                value={semanticType}
                onChange={(e) => setSemanticType(e.target.value)}
                placeholder="e.g., goal, constraint, insight, requirement"
              />
              <p className="text-xs text-gray-500">
                Common types: goal, constraint, insight, requirement, observation, decision
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="canonical-value">Canonical Value</Label>
              <Input
                id="canonical-value"
                value={canonicalValue}
                onChange={(e) => setCanonicalValue(e.target.value)}
                placeholder="Optional normalized form"
              />
              <p className="text-xs text-gray-500">
                Optional: A normalized or standardized version of the content
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <strong>Governance Notice:</strong> This block will be created through the governance workflow. 
                Depending on workspace settings, it may be created immediately or require approval.
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creating...' : 'Create Block'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
