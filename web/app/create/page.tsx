'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MemoryCapture, Input } from './components/MemoryCapture';
import { apiClient } from '@/lib/api/client';

export default function CreatePage() {
  const router = useRouter();
  const [basketId, setBasketId] = useState<string | null>(null);

  const handleMemoryFormation = async (intent: string, inputs: Input[]) => {
    const basket = await apiClient.request<{ id: string }>('/api/baskets/new', {
      method: 'POST',
      body: JSON.stringify({ intent, status: 'forming' }),
    });

    setBasketId(basket.id);

    const rawDumps = await Promise.all(
      inputs.map((input) =>
        apiClient.request<{ id: string }>(`/api/baskets/${basket.id}/raw_dumps`, {
          method: 'POST',
          body: JSON.stringify(input),
        })
      )
    );

    await apiClient.request(`/api/baskets/${basket.id}/work`, {
      method: 'POST',
      body: JSON.stringify({
        operation: 'INITIAL_FORMATION',
        raw_dump_ids: rawDumps.map((d) => d.id),
      }),
    });

    setTimeout(() => router.push(`/baskets/${basket.id}`), 3000);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <MemoryCapture onFormation={handleMemoryFormation} basketId={basketId} />
    </div>
  );
}

