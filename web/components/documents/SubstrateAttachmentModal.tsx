"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';
import type { SubstrateType } from '@shared/contracts/documents';

interface SubstrateAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    substrate_type: SubstrateType;
    substrate_id: string;
    role?: string;
    weight?: number;
  }) => Promise<void>;
}

export function SubstrateAttachmentModal({ isOpen, onClose, onSubmit }: SubstrateAttachmentModalProps) {
  const [substrateType, setSubstrateType] = useState<SubstrateType>('block');
  const [substrateId, setSubstrateId] = useState('');
  const [role, setRole] = useState('');
  const [weight, setWeight] = useState(0.5);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!substrateId.trim()) return;

    try {
      setLoading(true);
      await onSubmit({
        substrate_type: substrateType,
        substrate_id: substrateId.trim(),
        role: role.trim() || undefined,
        weight: weight
      });
      onClose();
      // Reset form
      setSubstrateId('');
      setRole('');
      setWeight(0.5);
    } catch (error) {
      console.error('Error attaching substrate:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Attach Substrate Reference</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Substrate Type
            </label>
            <select
              data-testid="substrate-type"
              value={substrateType}
              onChange={(e) => setSubstrateType(e.target.value as SubstrateType)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="block">Block</option>
              <option value="dump">Dump</option>
              <option value="context_item">Context Item</option>
              <option value="reflection">Reflection</option>
              <option value="timeline_event">Timeline Event</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Substrate ID
            </label>
            <input
              type="text"
              value={substrateId}
              onChange={(e) => setSubstrateId(e.target.value)}
              placeholder="Enter substrate UUID"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role (optional)
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., primary, supporting, context"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight: {(weight * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value))}
              className="w-full"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !substrateId.trim()}
              className="flex-1"
            >
              {loading ? 'Attaching...' : 'Attach Reference'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}