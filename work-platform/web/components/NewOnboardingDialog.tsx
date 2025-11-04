"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useRouter } from 'next/navigation';

interface NewOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewOnboardingDialog({ open, onOpenChange }: NewOnboardingDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [agentType, setAgentType] = useState<string>('research');
  const [initialContext, setInitialContext] = useState('');
  const [basketName, setBasketName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/work-requests/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_type: agentType,
          initial_context: initialContext,
          basket_name: basketName || undefined,
          work_mode: 'general',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to create work request' }));
        throw new Error(typeof errorData.detail === 'string' ? errorData.detail : errorData.detail?.message || 'Failed to create work request');
      }

      const result = await response.json();

      // Success! Close dialog and redirect to basket
      onOpenChange(false);

      // Reset form
      setAgentType('research');
      setInitialContext('');
      setBasketName('');

      // Show success message
      alert(`✅ Basket created successfully!\n\nBasket ID: ${result.basket_id}\nWork Request ID: ${result.work_request_id}\nRemaining Trials: ${result.remaining_trials ?? 'N/A'}\n\nNext: ${result.next_step}`);

      // Redirect to basket overview
      router.push(`/baskets/${result.basket_id}/overview`);
      router.refresh();
    } catch (err) {
      console.error('Failed to create work request:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Onboarding Workflow</DialogTitle>
          <DialogDescription>
            Phase 6: Basket-first onboarding for new users. This will create a new basket, raw dump, and work request.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="agent-type">Agent Type</Label>
            <Select value={agentType} onValueChange={setAgentType}>
              <SelectTrigger id="agent-type">
                <SelectValue placeholder="Select agent type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="research">Research Agent</SelectItem>
                <SelectItem value="content">Content Agent</SelectItem>
                <SelectItem value="reporting">Reporting Agent</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose the type of agent for this work request
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initial-context">Initial Context</Label>
            <Textarea
              id="initial-context"
              value={initialContext}
              onChange={(e) => setInitialContext(e.target.value)}
              placeholder="Describe what you want the agent to work on..."
              className="min-h-[150px] resize-none"
              required
              minLength={10}
              maxLength={50000}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters, maximum 50,000 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="basket-name">Basket Name (Optional)</Label>
            <Input
              id="basket-name"
              value={basketName}
              onChange={(e) => setBasketName(e.target.value)}
              placeholder="e.g., Healthcare AI Research"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              Auto-generated if not provided
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              <strong>Error:</strong> {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !initialContext.trim() || initialContext.length < 10}>
              {loading ? 'Creating...' : 'Create Work Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
