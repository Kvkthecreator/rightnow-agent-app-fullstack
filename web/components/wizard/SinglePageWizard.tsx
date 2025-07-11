"use client";
import { useCreateBasket } from "@/hooks/useCreateBasket";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import React from "react";

function TextareaCard({
  value,
  onChange,
  index,
}: {
  value: string;
  onChange: (v: string) => void;
  index: number;
}) {
  const [open, setOpen] = React.useState(true);
  return (
    <Card className="space-y-2">
      <div
        className="flex justify-between cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <span className="font-medium">Dump {index + 1}</span>
        <span>{open ? "-" : "+"}</span>
      </div>
      {open && (
        <>
          <label className="sr-only" htmlFor={`dump-${index}`}>Dump {index + 1}</label>
          <Textarea
            id={`dump-${index}`}
            rows={4}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <p className="text-xs text-right text-muted-foreground">
            {value.length} chars
          </p>
        </>
      )}
    </Card>
  );
}

export function SinglePageWizard() {
  const state = useCreateBasket();
  return (
    <div className="space-y-6 max-w-2xl mx-auto" data-testid="sp-wizard">
      <div className="space-y-2">
        <label htmlFor="basket-name" className="text-sm font-medium">
          Basket Name
        </label>
        <Input
          id="basket-name"
          value={state.basketName}
          onChange={(e) => state.setBasketName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="core-block" className="text-sm font-medium">
          Core Block
        </label>
        <Textarea
          id="core-block"
          rows={4}
          value={state.coreBlock}
          onChange={(e) => state.setCoreBlock(e.target.value)}
        />
        <p className="text-xs text-right text-muted-foreground">
          {state.coreBlock.length}/100–500
        </p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Raw Dumps</label>
        {state.dumps.map((d, i) => (
          <TextareaCard
            key={i}
            value={d}
            index={i}
            onChange={(v) => state.setDump(i, v)}
          />
        ))}
        {state.dumps.length < 10 && (
          <Button
            variant="ghost"
            onClick={state.addDump}
            type="button"
          >
            Add Dump
          </Button>
        )}
      </div>
      <div className="space-y-2">
        <label htmlFor="guidelines" className="text-sm font-medium">
          Guidelines (optional)
        </label>
        <Textarea
          id="guidelines"
          rows={4}
          value={state.guidelines}
          onChange={(e) => state.setGuidelines(e.target.value)}
        />
      </div>
      <div className="text-right">
        <Button onClick={state.submit} disabled={!state.canSubmit}>
          Create Basket
        </Button>
      </div>
    </div>
  );
}

export default SinglePageWizard;
