"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import InsightCanonCard from '@/components/insights/InsightCanonCard';

interface InsightCanonClientProps {
  basketId: string;
}

export default function InsightCanonClient({ basketId }: InsightCanonClientProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Button
        onClick={() => router.push(`/baskets/${basketId}/memory`)}
        variant="ghost"
        size="sm"
        className="mb-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Memory
      </Button>

      {/* Full insight display using reusable component */}
      <InsightCanonCard basketId={basketId} compact={false} />

      {/* Future: Add version history / lineage here */}
      {/* Future: Add freshness status indicators */}
    </div>
  );
}
