'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MemoryCapture, SourceInput } from './components/MemoryCapture';
import { apiClient } from '@/lib/api/client';

export default function CreatePage() {
  const router = useRouter();
  const [basketId, setBasketId] = useState<string | null>(null);

  const handleMemoryFormation = async (intent: string, inputs: SourceInput[]) => {
    try {
      // 1. Create basket with correct endpoint
      const basket = await apiClient.request<{ id: string }>('/api/baskets', {
        method: 'POST',
        body: JSON.stringify({ 
          name: intent || 'New Basket',
          description: intent,
          status: 'INIT' 
        }),
      });

      // 2. Set basket ID for loading UI
      setBasketId(basket.id);

      // 3. Create raw dumps using the correct dump API
      if (inputs.length > 0) {
        await Promise.all(
          inputs.map((input) =>
            apiClient.request('/api/dumps/new', {
              method: 'POST',
              body: JSON.stringify({
                basket_id: basket.id,
                text_dump: input.content || `File: ${input.name}`,
                file_urls: input.type === 'file' ? [input.id] : []
              }),
            })
          )
        );
      }

      // 4. Redirect immediately to work page (remove delay)
      router.push(`/baskets/${basket.id}/work`);
      
    } catch (error) {
      console.error('❌ Basket creation failed:', error);
      // Reset loading state on error
      setBasketId(null);
      alert('Failed to create basket. Please try again.');
    }
  };

  return (
    <div className="container py-8">
      <MemoryCapture onFormation={handleMemoryFormation} basketId={basketId} />
    </div>
  );
}

