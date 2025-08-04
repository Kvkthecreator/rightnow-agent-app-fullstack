"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { fetchWithToken } from '@/lib/fetchWithToken';

// Think of this as a "shared data store" that all components can access
// Like having a central database that updates everywhere at once

interface Basket {
  id: string;
  name: string;
  description?: string;
  status?: string;
  created_at: string;
  updated_at: string;
}

interface BasketContextType {
  basket: Basket | null;
  updateBasketName: (newName: string) => Promise<void>;
  setBasket: (basket: Basket) => void;
  isUpdating: boolean;
  error: string | null;
}

// Create the context (think of it as creating the shared space)
const BasketContext = createContext<BasketContextType | undefined>(undefined);

// Provider component that wraps around parts of your app
export function BasketProvider({ 
  children, 
  initialBasket 
}: { 
  children: ReactNode;
  initialBasket: Basket | null;
}) {
  const [basket, setBasket] = useState<Basket | null>(initialBasket);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to update basket name
  const updateBasketName = useCallback(async (newName: string) => {
    if (!basket) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      // Optimistically update the UI (show change immediately)
      setBasket(prev => prev ? { ...prev, name: newName } : null);
      
      // Make API call
      const response = await fetchWithToken(`/api/baskets/${basket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update basket name');
      }

      const updatedBasket = await response.json();
      // Update with server response
      setBasket(updatedBasket);
      
    } catch (err) {
      // Revert on error
      setBasket(basket);
      setError(err instanceof Error ? err.message : 'Failed to update basket name');
      console.error('Failed to update basket name:', err);
    } finally {
      setIsUpdating(false);
    }
  }, [basket]);

  return (
    <BasketContext.Provider value={{
      basket,
      updateBasketName,
      setBasket,
      isUpdating,
      error
    }}>
      {children}
    </BasketContext.Provider>
  );
}

// Hook to use the basket context
export function useBasket() {
  const context = useContext(BasketContext);
  if (context === undefined) {
    throw new Error('useBasket must be used within a BasketProvider');
  }
  return context;
}

// 🎯 Product Manager Explanation:
// This creates a "single source of truth" for basket data
// When you update the basket name here, it automatically updates everywhere
// No need for page refreshes or complex syncing - it just works!