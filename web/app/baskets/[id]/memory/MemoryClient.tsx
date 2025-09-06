"use client";

import { useState } from 'react';
import { TodayReflectionCard, ReflectionCards } from "@/components/basket";
import { DocumentsList } from '@/components/documents/DocumentsList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SubpageHeader } from '@/components/basket/SubpageHeader';
import { PenTool } from 'lucide-react';
import AddMemoryModal from '@/components/memory/AddMemoryModal';
import OnboardingPanel from '@/components/memory/OnboardingPanel';

interface Props {
  basketId: string;
  pattern?: string;
  tension?: string | null;
  question?: string;
  fallback: string;
  needsOnboarding?: boolean;
}

export default function MemoryClient({ basketId, pattern, tension, question, fallback, needsOnboarding }: Props) {
  const [showAddMemory, setShowAddMemory] = useState(false);
  const refreshDocuments = () => {
    // This will trigger DocumentsList to refresh
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {needsOnboarding && (
        <OnboardingPanel 
          basketId={basketId}
          onComplete={() => window.location.reload()}
        />
      )}
      
      <SubpageHeader
        title="Your Memory"
        basketId={basketId}
        description="Capture thoughts and create documents to organize your knowledge"
        rightContent={
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowAddMemory(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <PenTool className="h-4 w-4" />
              Add Memory
            </Button>
          </div>
        }
      />
      
      <TodayReflectionCard line={undefined} fallback={fallback} />
      
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Documents */}
        <div className="col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Documents & Files</CardTitle>
              <p className="text-sm text-gray-600">Your uploaded documents and files</p>
            </CardHeader>
            <CardContent>
              <DocumentsList basketId={basketId} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Insights */}
        <div className="col-span-4">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Memory Insights</CardTitle>
              <p className="text-sm text-gray-600">Patterns discovered in your memory</p>
            </CardHeader>
            <CardContent>
              <ReflectionCards pattern={pattern} tension={tension} question={question || null} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <AddMemoryModal
        basketId={basketId}
        open={showAddMemory}
        onClose={() => setShowAddMemory(false)}
        onSuccess={() => {
          setShowAddMemory(false);
          refreshDocuments();
        }}
      />
    </div>
  );
}

