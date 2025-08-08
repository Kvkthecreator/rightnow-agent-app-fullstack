"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSubstrate } from '@/lib/substrate/useSubstrate';
import OrganicSpinner from '@/components/ui/OrganicSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

interface SubstrateDashboardProps {
  basketId: string;
}

export function SubstrateDashboard({ basketId }: SubstrateDashboardProps) {
  const router = useRouter();
  const substrate = useSubstrate(basketId, 'default');

  if (substrate.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <OrganicSpinner className="mx-auto mb-4" />
          <p className="text-lg text-gray-600 mt-6">Substrate loading... please wait</p>
        </div>
      </div>
    );
  }

  if (substrate.error) {
    return (
      <ErrorMessage 
        error={substrate.error} 
        onRetry={substrate.refreshSubstrate}
        title="Failed to load substrate intelligence"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">SubstrateDashboard Migration Required</h2>
        <p className="text-gray-600 mb-4">
          This component needs to be migrated to the TRUE Context OS unified system.
        </p>
        <p className="text-sm text-gray-500">
          Use SubstrateCanvas for the full Context OS experience.
        </p>
      </div>
    </div>
  );
}