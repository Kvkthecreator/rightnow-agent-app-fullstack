"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

interface Props {
  basketId: string;
}

export default function OnboardingForm({ basketId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [tension, setTension] = useState("");
  const [aspiration, setAspiration] = useState("");
  const [memory, setMemory] = useState("");

  const storageKey = user ? `onboarding-${user.id}` : null;

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
          setStep(parsed.step ?? 0);
        } catch {}
      }
    }
  }, [storageKey]);

  useEffect(() => {
    if (storageKey) {
      const data = { name, tension, aspiration, memory, step };
      localStorage.setItem(storageKey, JSON.stringify(data));
    }
  }, [storageKey, name, tension, aspiration, memory, step]);

  async function submit() {
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
  }

  const steps = [
    (
      <div className="space-y-6 max-w-md">
        <div>
          <h1 className="text-2xl font-bold">Before we hold your thoughts, let’s start with you.</h1>
          <p className="mt-2 text-muted-foreground">Yarnnn works best when it knows the human behind the thread.</p>
        </div>
        <Button onClick={() => setStep(1)}>Begin the Mirror</Button>
      </div>
    ),
    (
      <div className="space-y-6 max-w-md">
        <div>
          <h2 className="text-xl font-semibold">What’s your name?</h2>
          <p className="mt-2 text-muted-foreground">We’ll remember this. This is the start of your thread.</p>
        </div>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        <Button onClick={() => setStep(2)} disabled={!name.trim()}>Next</Button>
      </div>
    ),
    (
      <div className="space-y-6 max-w-md">
        <div>
          <h2 className="text-xl font-semibold">What’s something you keep circling back to lately?</h2>
          <p className="mt-2 text-muted-foreground">It doesn’t need to be a formal plan. Just a thought, a worry, or a question that’s taking up space in your mind.</p>
        </div>
        <Textarea
          value={tension}
          onChange={(e) => setTension(e.target.value)}
          rows={4}
          placeholder="Finding my first 10 true fans · The fear my idea isn’t unique enough · Balancing my day job with this project"
        />
        <Button onClick={() => setStep(3)} disabled={!tension.trim()}>Next</Button>
      </div>
    ),
    (
      <div className="space-y-6 max-w-md">
        <div>
          <h2 className="text-xl font-semibold">What’s something you’ve always wanted to make time for?</h2>
          <p className="mt-2 text-muted-foreground">Think about the project or idea that truly excites you. This isn't a task, it's a direction. It becomes a foundational part of your memory.</p>
        </div>
        <Textarea
          value={aspiration}
          onChange={(e) => setAspiration(e.target.value)}
          rows={4}
          placeholder="Writing a book about my industry · Building a product that helps people like me · Finally learning to code in Rust"
        />
        <Button onClick={() => setStep(4)} disabled={!aspiration.trim()}>Next</Button>
      </div>
    ),
    (
      <div className="space-y-6 max-w-md">
        <div>
          <label className="font-semibold">Paste your ChatGPT Memory (optional)</label>
          <p className="mt-2 text-muted-foreground">We’ll ingest this as normal memory so your reflections start in context.</p>
        </div>
        <Textarea value={memory} onChange={(e) => setMemory(e.target.value)} rows={6} />
        <Button onClick={submit} disabled={!name.trim() || !tension.trim() || !aspiration.trim()}>Finish</Button>
      </div>
    ),
  ];

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="flex space-x-2">
        {[0,1,2,3,4].map((i) => (
          <span key={i} className={`h-2 w-2 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>
      {steps[step]}
    </div>
  );
}
