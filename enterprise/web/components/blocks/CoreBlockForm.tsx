"use client";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { TextareaInline } from "@/components/TextareaInline";

let z: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  z = require("zod");
} catch {
  // library missing
}

interface CoreBlockFormProps {
  title: string;
  prompt: string;
  label: string;
  content: string;
  onLabelChange: (v: string) => void;
  onContentChange: (v: string) => void;
}

export default function CoreBlockForm({
  title,
  prompt,
  label,
  content,
  onLabelChange,
  onContentChange,
}: CoreBlockFormProps) {
  const [errors, setErrors] = useState<{ label?: string; content?: string }>({});

  function validate(l: string, c: string) {
    if (!z) return {};
    const schema = z.object({
      label: z.string().min(1, "Required"),
      content: z.string().min(1, "Required"),
    });
    const res = schema.safeParse({ label: l, content: c });
    return res.success ? {} : res.error.flatten().fieldErrors;
  }

  function handleBlur() {
    setErrors(validate(label, content));
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-muted-foreground">Label</label>
        <Input
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          onBlur={handleBlur}
        />
        {errors.label && <p className="text-xs text-red-500">{errors.label}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-muted-foreground">{title}</label>
        <textarea
          className="mt-1 w-full border rounded p-2"
          rows={6}
          placeholder={prompt}
          value={content}
          onBlur={handleBlur}
          onChange={(e) => onContentChange(e.target.value)}
        />
        {errors.content && <p className="text-xs text-red-500">{errors.content}</p>}
      </div>
    </div>
  );
}
