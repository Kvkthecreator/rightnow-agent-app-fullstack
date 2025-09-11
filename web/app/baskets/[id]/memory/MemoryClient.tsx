"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReflectionCards } from "@/components/basket";
import { DocumentsList } from '@/components/documents/DocumentsList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SubpageHeader } from '@/components/basket/SubpageHeader';
import { DocumentCreateButton } from '@/components/documents/DocumentCreateButton';
import { PenTool } from 'lucide-react';
import AddMemoryModal from '@/components/memory/AddMemoryModal';
import OnboardingPanel from '@/components/memory/OnboardingPanel';
import { useReflectionNotifications } from '@/lib/hooks/useReflectionNotifications';

interface Props {
  basketId: string;
  pattern?: string;
  tension?: string | null;
  question?: string;
  needsOnboarding?: boolean;
}

export default function MemoryClient({ basketId, pattern, tension, question, needsOnboarding }: Props) {
  const [showAddMemory, setShowAddMemory] = useState(false);
  const router = useRouter();
  const refreshDocuments = () => {
    // Prefer soft refresh to avoid jarring redirects
    try { router.refresh(); } catch {}
  };

  // Micro-reflection notifications for this basket
  useReflectionNotifications(basketId);

  return (
    <div className="space-y-6">
      
      <SubpageHeader
        title="Your Memory"
        basketId={basketId}
        description="Capture thoughts and create documents to organize your knowledge"
        rightContent={
          <div className="flex items-center gap-3">
            <DocumentCreateButton basketId={basketId} />
            <Button
              onClick={async () => {
                try {
                  await fetch('/api/reflections/trigger', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ basket_id: basketId }),
                  });
                } catch {}
                router.refresh();
              }}
              variant="ghost"
              size="sm"
              className="text-sm"
            >
              Refresh insights
            </Button>
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

      {needsOnboarding && (
        <OnboardingPanel 
          basketId={basketId}
          onComplete={() => window.location.reload()}
        />
      )}
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentsList basketId={basketId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memory Insights</CardTitle>
            <p className="text-sm text-gray-600">Patterns discovered in your memory</p>
          </CardHeader>
          <CardContent>
            <ReflectionCards pattern={pattern} tension={tension} question={question || null} />
          </CardContent>
        </Card>
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