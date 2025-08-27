"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CheckCircle2, Circle, User, Brain, Target, Archive } from "lucide-react";
import { cn } from "@/lib/utils";

function autoResize(e: ChangeEvent<HTMLTextAreaElement>) {
  e.target.style.height = "auto";
  e.target.style.height = `${e.target.scrollHeight}px`;
}

interface Props {
  basketId: string;
}

interface CompletionState {
  name: boolean;
  tension: boolean;
  aspiration: boolean;
  memory: boolean;
}

export default function OnboardingDashboard({ basketId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [tension, setTension] = useState("");
  const [aspiration, setAspiration] = useState("");
  const [memory, setMemory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const storageKey = user ? `onboarding-${user.id}` : null;

  // Load saved data
  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setName(parsed.name ?? "");
          setTension(parsed.tension ?? "");
          setAspiration(parsed.aspiration ?? "");
          setMemory(parsed.memory ?? "");
        } catch {}
      }
    }
  }, [storageKey]);

  // Auto-save progress
  useEffect(() => {
    if (storageKey) {
      const data = { name, tension, aspiration, memory };
      localStorage.setItem(storageKey, JSON.stringify(data));
    }
  }, [storageKey, name, tension, aspiration, memory]);

  const completion: CompletionState = {
    name: name.trim().length > 0,
    tension: tension.trim().length > 0,
    aspiration: aspiration.trim().length > 0,
    memory: memory.trim().length > 0,
  };

  const completedCount = Object.values(completion).filter(Boolean).length;
  const requiredCount = 3; // name, tension, aspiration required; memory optional
  const canSubmit = completion.name && completion.tension && completion.aspiration;

  async function submit() {
    if (!canSubmit) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basket_id: basketId,
          name,
          tension,
          aspiration,
          memory_paste: memory || undefined,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (storageKey) localStorage.removeItem(storageKey);
        const profile = data.profile_document_id ? `&profile=${data.profile_document_id}` : '';
        router.push(`/baskets/${basketId}/memory?onboarded=1${profile}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-semibold">Complete Your Identity Profile</h1>
        <p className="text-sm text-muted-foreground">
          Help Yarnnn understand you better. Complete sections improve your memory workspace.
        </p>
        <div className="text-xs text-muted-foreground">
          {completedCount} of 4 sections completed • {requiredCount} required
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {[
          { key: 'name', label: 'Name', icon: User, required: true },
          { key: 'tension', label: 'Current Focus', icon: Brain, required: true },
          { key: 'aspiration', label: 'Aspiration', icon: Target, required: true },
          { key: 'memory', label: 'Memory Import', icon: Archive, required: false },
        ].map(({ key, label, icon: Icon, required }) => {
          const isComplete = completion[key as keyof CompletionState];
          return (
            <Card
              key={key}
              className={cn(
                "onboarding-card--compact transition-all !p-3",
                isComplete
                  ? "ring-2 ring-green-500"
                  : required
                  ? "ring-1 ring-orange-200"
                  : "ring-1 ring-border"
              )}
            >
              <CardContent className="p-0 text-center space-y-1">
                <div className="flex items-center justify-center">
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center justify-center">
                  <Icon className="w-4 h-4 text-muted-foreground mr-1" />
                  <span className="text-xs font-medium">{label}</span>
                </div>
                {required && !isComplete && (
                  <span className="text-[10px] text-orange-600">Required</span>
                )}
                {!required && (
                  <span className="text-[10px] text-muted-foreground">Optional</span>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Input Sections */}
      <div className="grid gap-4">
        {/* Name Section */}
        <Card
          className={cn(
            "onboarding-card--compact",
            completion.name ? "ring-1 ring-green-200" : "ring-1 ring-orange-200"
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base">
              <User className="w-4 h-4 mr-2" />
              What's your name?
              {completion.name && (
                <CheckCircle2 className="w-4 h-4 ml-auto text-green-500" />
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground">Saved as part of your profile.</p>
          </CardHeader>
          <CardContent className="pt-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {/* Tension Section */}
        <Card
          className={cn(
            "onboarding-card--compact",
            completion.tension ? "ring-1 ring-green-200" : "ring-1 ring-orange-200"
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base">
              <Brain className="w-4 h-4 mr-2" />
              What's something you keep circling back to lately?
              {completion.tension && (
                <CheckCircle2 className="w-4 h-4 ml-auto text-green-500" />
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              A current question or worry. Saved as part of your profile.
            </p>
          </CardHeader>
          <CardContent className="pt-2">
            <Textarea
              value={tension}
              onChange={(e) => setTension(e.target.value)}
              onInput={autoResize}
              rows={1}
              className="resize-none overflow-hidden"
              placeholder="Finding my first 10 true fans • The fear my idea isn't unique enough • Balancing my day job with this project"
            />
          </CardContent>
        </Card>

        {/* Aspiration Section */}
        <Card
          className={cn(
            "onboarding-card--compact",
            completion.aspiration ? "ring-1 ring-green-200" : "ring-1 ring-orange-200"
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base">
              <Target className="w-4 h-4 mr-2" />
              What's something you've always wanted to make time for?
              {completion.aspiration && (
                <CheckCircle2 className="w-4 h-4 ml-auto text-green-500" />
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              What you want to make time for. Saved as part of your profile.
            </p>
          </CardHeader>
          <CardContent className="pt-2">
            <Textarea
              value={aspiration}
              onChange={(e) => setAspiration(e.target.value)}
              onInput={autoResize}
              rows={1}
              className="resize-none overflow-hidden"
              placeholder="Writing a book about my industry • Building a product that helps people like me • Finally learning to code in Rust"
            />
          </CardContent>
        </Card>

        {/* Memory Import Section */}
        <Card
          className={cn(
            "onboarding-card--compact bg-muted/30",
            completion.memory ? "ring-1 ring-green-200" : "ring-1 ring-border"
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm text-muted-foreground">
              <Archive className="w-4 h-4 mr-2" />
              Memory Import
              {completion.memory && (
                <CheckCircle2 className="w-4 h-4 ml-auto text-green-500" />
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Optional: paste existing memory or context.
            </p>
          </CardHeader>
          <CardContent className="pt-2">
            <Textarea
              value={memory}
              onChange={(e) => setMemory(e.target.value)}
              onInput={autoResize}
              rows={1}
              className="resize-none overflow-hidden"
              placeholder="Paste any existing memory or context that would help Yarnnn understand you better..."
            />
          </CardContent>
        </Card>
      </div>

      {/* Submit Section */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 onboarding-card--compact">
        <CardContent className="p-0 text-center space-y-3">
          <div>
            <h3 className="font-semibold mb-1">Ready to enhance your memory workspace?</h3>
            <p className="text-xs text-muted-foreground">
              {canSubmit
                ? "All required sections complete. Your identity will seed this basket's substrate."
                : `Complete ${requiredCount - Object.values({name: completion.name, tension: completion.tension, aspiration: completion.aspiration}).filter(Boolean).length} more required sections to continue.`
              }
            </p>
          </div>

          <Button
            onClick={submit}
            disabled={!canSubmit || isSubmitting}
            size="lg"
            className="min-w-32"
          >
            {isSubmitting ? "Creating..." : "Complete Profile"}
          </Button>

          {!canSubmit && (
            <p className="text-[10px] text-muted-foreground">
              Name, Current Focus, and Aspiration are required
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}