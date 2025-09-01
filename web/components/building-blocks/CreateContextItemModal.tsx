"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CreateContextItemModalProps {
  basketId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateContextItemModal({ basketId, open, onClose, onSuccess }: CreateContextItemModalProps) {
  const [label, setLabel] = useState('');
  const [content, setContent] = useState('');
  const [synonyms, setSynonyms] = useState('');
  const [kind, setKind] = useState<'concept' | 'entity' | 'topic' | 'theme'>('concept');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!label.trim()) {
      toast.error('Label is required');
      return;
    }

    setLoading(true);
    
    try {
      // Route through governance-aware changes API
      const response = await fetch('/api/changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_point: 'manual_edit',
          basket_id: basketId,
          ops: [{
            type: 'CreateContextItem',
            data: {
              label: label.trim(),
              content: content.trim() || undefined,
              synonyms: synonyms.trim() ? synonyms.split(',').map(s => s.trim()).filter(Boolean) : [],
              kind,
              confidence: 0.9 // High confidence for manual creation
            }
          }]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create context item');
      }

      const result = await response.json();
      
      if (result.route === 'direct') {
        toast.success('Context item created ✓');
      } else {
        toast.success('Context item creation proposed for review ⏳');
        console.log(`View proposal at: /baskets/${basketId}/governance?highlight=${result.proposal_id}`);
      }

      // Reset form
      setLabel('');
      setContent('');
      setSynonyms('');
      setKind('concept');
      onClose();
      onSuccess?.();

    } catch (error) {
      console.error('Context item creation failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create context item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Create New Context Item
          </DialogTitle>
        </DialogHeader>
        
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label *</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Project Management, Customer Feedback, Technical Debt"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Description</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Optional detailed description of this context item..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kind">Kind</Label>
                <select
                  id="kind"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as typeof kind)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="concept">Concept</option>
                  <option value="entity">Entity</option>
                  <option value="topic">Topic</option>
                  <option value="theme">Theme</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="synonyms">Synonyms</Label>
                <Input
                  id="synonyms"
                  value={synonyms}
                  onChange={(e) => setSynonyms(e.target.value)}
                  placeholder="Alternative terms, comma-separated"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <strong>Governance Notice:</strong> This context item will be created through the governance workflow. 
                Depending on workspace settings, it may be created immediately or require approval.
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creating...' : 'Create Context Item'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}