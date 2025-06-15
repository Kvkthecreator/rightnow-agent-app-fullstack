/* Yarnnn Basket Create Draft Page - fixed UploadArea props */

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { UploadArea } from "@/components/baskets/UploadArea";

export default function BasketCreateDraftPage() {
  const [dumpText, setDumpText] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleCreate = () => {
    if (dumpText.trim() === "") return; // require dump text
    setSubmitted(true);
    // here you'd trigger API call to create basket
    console.log("Creating basket:", { dumpText, name });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center text-2xl font-brand">🧶 start a new thread</div>

      <Textarea
        className={`min-h-[300px] w-full resize-y rounded-2xl border p-4 text-lg shadow-sm bg-muted/50 ${submitted ? 'opacity-80' : ''}`}
        placeholder="Pour your thoughts, ideas, or goals here..."
        value={dumpText}
        onChange={(e) => setDumpText(e.target.value)}
        readOnly={submitted}
      />

      <UploadArea
        prefix="basket-draft"
        maxFiles={5}
        onUpload={(url) => console.log("Uploaded files:", url)}
      />

      <div className="flex flex-col gap-2">
        <Input
          placeholder="Name your basket (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitted}
        />
        <Button onClick={handleCreate} disabled={submitted || dumpText.trim() === ""}>
          {submitted ? "Basket Created" : "Create Basket"}
        </Button>
      </div>
    </div>
  );
}
