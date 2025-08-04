"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSubstrateIntelligence } from '@/lib/substrate/useSubstrateIntelligence';
import { GeneralInfoSection } from './GeneralInfoSection';
import { NarrativeOverview } from './NarrativeOverview';
import { DocumentGrid } from './DocumentGrid';
import { InsightsAndActions } from './InsightsAndActions';
import OrganicSpinner from '@/components/ui/OrganicSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

interface SubstrateDashboardProps {
  basketId: string;
}

export function SubstrateDashboard({ basketId }: SubstrateDashboardProps) {
  const router = useRouter();
  const { intelligence, loading, error, refresh, addContext } = useSubstrateIntelligence(basketId);

  // Adapter function to convert simple params to SubstrateContentInput format
  const handleAddContext = async (content: string, type: 'text' | 'file' | 'pdf' | 'image', files?: File[]): Promise<void> => {
    const substrateInput = [{
      type,
      content,
      metadata: files && files.length > 0 ? {
        filename: files[0].name,
        size: files[0].size,
        fileObject: files[0]
      } : undefined
    }];
    await addContext(substrateInput);
  };

  // Handle document actions
  const handleDocumentAction = async (docId: string, action: string) => {
    switch (action) {
      case 'view':
        router.push(`/baskets/${basketId}/work/documents/${docId}`);
        break;
      case 'edit':
        router.push(`/baskets/${basketId}/work/documents/${docId}`);
        break;
      case 'review':
        // For now, same as view - could be enhanced with review mode
        router.push(`/baskets/${basketId}/work/documents/${docId}`);
        break;
      case 'lock':
        // Implement document locking - placeholder for now
        console.log('Document locking not yet implemented:', docId);
        break;
      case 'help':
        // Show contextual help - placeholder for now
        console.log('Contextual help not yet implemented:', docId);
        break;
      default:
        console.log('Unknown document action:', action, docId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <OrganicSpinner size="lg" />
          <p className="text-lg text-gray-600 mt-6">Basket loading... please wait</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage 
        error={error} 
        onRetry={refresh}
        title="Failed to load substrate intelligence"
      />
    );
  }

  if (!intelligence) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">🧠</div>
          <h2 className="text-xl font-semibold mb-2">No substrate data available</h2>
          <p className="text-gray-600">This basket may not have any content yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 space-y-6 max-w-7xl">
        {/* General Info Section */}
        <GeneralInfoSection basketInfo={intelligence.basketInfo} />
        
        {/* Narrative Overview - Trust Building */}
        <NarrativeOverview 
          contextUnderstanding={intelligence.contextUnderstanding}
          substrateHealth={intelligence.substrateHealth}
        />
        
        {/* Document Grid - Living Documents */}
        <DocumentGrid 
          documents={intelligence.documents}
          onDocumentAction={handleDocumentAction}
        />
        
        {/* Insights & Actions - Context Judgment + Control */}
        <InsightsAndActions 
          intelligence={intelligence.intelligence}
          onAddContext={handleAddContext}
          onRefresh={refresh}
        />
      </div>
    </div>
  );
}