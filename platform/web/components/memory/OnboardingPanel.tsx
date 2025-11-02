"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Sparkles, FileText, Upload, Tag, X } from "lucide-react";
import AddMemoryModal from "@/components/memory/AddMemoryModal";
import CreateContextItemModal from "@/components/building-blocks/CreateContextItemModal";

interface OnboardingPanelProps {
  basketId: string;
  onComplete?: () => void;
  onDismiss?: () => void;
}

export default function OnboardingPanel({ basketId, onComplete, onDismiss }: OnboardingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [showAddMeaning, setShowAddMeaning] = useState(false);

  // When opening file upload, auto-trigger the hidden file input click
  useEffect(() => {
    if (showAddMemory) {
      // Let the modal mount, then try to click file input if present
      const t = setTimeout(() => {
        const input = document.getElementById("memory-file-input") as HTMLInputElement | null;
        if (input) input.click();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [showAddMemory]);

  const handleNoteClick = () => {
    // Hint AddMemoryComposer to focus textarea
    try {
      window.location.hash = "#add";
    } catch {}
    setShowAddMemory(true);
  };

  const handleFileClick = () => {
    setShowAddMemory(true);
  };

  const handleMeaningClick = () => {
    setShowAddMeaning(true);
  };

  const handleSuccess = () => {
    setShowAddMemory(false);
    setShowAddMeaning(false);
    setIsExpanded(false);
    onComplete?.();
    // Refresh to recompute gating and hide panel next render
    window.location.reload();
  };

  if (!isExpanded) {
    return (
      <Card className="mb-4 border-purple-200 bg-purple-50">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <div>
              <p className="font-medium text-sm">Get started</p>
              <p className="text-xs text-muted-foreground">Upload a file, paste a note, or add a meaning</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(true)}>
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-purple-200 dark:border-purple-800">
      <CardHeader className="bg-purple-50 dark:bg-purple-950/20 border-b border-purple-100 dark:border-purple-800">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Let's get you started
            </CardTitle>
            <CardDescription className="mt-1">
              Bring in what you're working on or set your focus
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsExpanded(false);
              onDismiss?.();
            }}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 gap-4">
          {/* Add Memory Card */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Bring in what you’re working on</h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Upload a file or paste a quick note. I’ll organize it for you.
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleFileClick}>
                <Upload className="h-4 w-4 mr-1" /> Upload a file
              </Button>
              <Button size="sm" variant="outline" onClick={handleNoteClick}>
                Paste a note
              </Button>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">PDFs, images, and text supported</p>
          </div>

          {/* Add Meaning Card */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Set your focus</h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Tell me the one thing you’re aiming for. It helps me prioritize.
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleMeaningClick}>
                Create your first meaning
              </Button>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">We’ll treat this as your current focus</p>
          </div>
        </div>

        {/* Modals */}
        <AddMemoryModal
          basketId={basketId}
          open={showAddMemory}
          onClose={() => setShowAddMemory(false)}
          onSuccess={handleSuccess}
        />
        <CreateContextItemModal
          basketId={basketId}
          open={showAddMeaning}
          onClose={() => setShowAddMeaning(false)}
          onSuccess={handleSuccess}
          initialKind="intent"
          variant="onboarding"
        />
      </CardContent>
    </Card>
  );
}
