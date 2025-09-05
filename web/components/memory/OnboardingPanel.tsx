"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Circle, X, ChevronRight, User, Brain, Target, Archive, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface OnboardingPanelProps {
  basketId: string;
  onComplete?: () => void;
  onDismiss?: () => void;
}

export default function OnboardingPanel({ basketId, onComplete, onDismiss }: OnboardingPanelProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [tension, setTension] = useState('');
  const [aspiration, setAspiration] = useState('');
  const [memory, setMemory] = useState('');
  
  const storageKey = user ? `onboarding-unified-${user.id}` : null;

  // Load saved data
  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setName(parsed.name ?? '');
          setTension(parsed.tension ?? '');
          setAspiration(parsed.aspiration ?? '');
          setMemory(parsed.memory ?? '');
        } catch (e) {
          console.error('Failed to load saved onboarding data', e);
        }
      }
    }
  }, [storageKey]);

  // Save on change
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ name, tension, aspiration, memory })
      );
    }
  }, [storageKey, name, tension, aspiration, memory]);

  const isComplete = (field: string) => {
    switch (field) {
      case 'name': return name.trim().length > 0;
      case 'tension': return tension.trim().length > 0;
      case 'aspiration': return aspiration.trim().length > 0;
      case 'memory': return memory.trim().length > 0;
      default: return false;
    }
  };

  const canSubmit = isComplete('name') && isComplete('tension') && isComplete('aspiration');
  const completedCount = ['name', 'tension', 'aspiration', 'memory'].filter(isComplete).length;

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const { fetchWithToken } = await import('@/lib/fetchWithToken');
      const res = await fetchWithToken('/api/onboarding/complete', {
        method: 'POST',
        body: JSON.stringify({
          basket_id: basketId,
          name,
          tension,
          aspiration,
          memory_paste: memory || undefined,
        }),
      });
      
      if (res.ok) {
        if (storageKey) localStorage.removeItem(storageKey);
        toast.success('Welcome to your memory workspace!');
        onComplete?.();
        window.location.reload(); // Refresh to show updated state
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Onboarding submission failed:', error);
      toast.error('Failed to complete onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isExpanded) {
    return (
      <Card className="mb-4 border-purple-200 bg-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-sm">Complete your profile to unlock full features</p>
                <p className="text-xs text-muted-foreground">{completedCount} of 4 sections completed</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-1"
            >
              Continue Setup
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-purple-200">
      <CardHeader className="bg-purple-50 border-b border-purple-100">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Welcome to Your Memory Workspace
            </CardTitle>
            <CardDescription className="mt-1">
              Help us understand you better to enhance your experience
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

      <CardContent className="p-6 space-y-6">
        {/* Progress indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { key: 'name', label: 'Name', icon: User, required: true },
            { key: 'tension', label: 'Current Focus', icon: Brain, required: true },
            { key: 'aspiration', label: 'Aspiration', icon: Target, required: true },
            { key: 'memory', label: 'Memory Import', icon: Archive, required: false },
          ].map(({ key, label, icon: Icon, required }) => (
            <div
              key={key}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg border transition-colors",
                isComplete(key)
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200 bg-gray-50"
              )}
            >
              {isComplete(key) ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-gray-400 shrink-0" />
              )}
              <Icon className="w-4 h-4 text-gray-600 shrink-0" />
              <span className="text-xs font-medium truncate">
                {label} {required && '*'}
              </span>
            </div>
          ))}
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Your Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How should we address you?"
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              What's on your mind? <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={tension}
              onChange={(e) => setTension(e.target.value)}
              placeholder="What challenges or questions are you currently working through?"
              className="w-full min-h-[80px]"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              What do you aspire to? <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={aspiration}
              onChange={(e) => setAspiration(e.target.value)}
              placeholder="What would you like to achieve or become?"
              className="w-full min-h-[80px]"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Memory Import <span className="text-muted-foreground">(Optional)</span>
            </label>
            <Textarea
              value={memory}
              onChange={(e) => setMemory(e.target.value)}
              placeholder="Paste any existing notes, thoughts, or content you'd like to import..."
              className="w-full min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This helps us understand your thinking patterns and interests
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(false)}
            disabled={isSubmitting}
          >
            Complete Later
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? 'Creating...' : 'Start My Journey'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}