"use client";
import { copy as mdc } from "../multi_doc_consistency/copy";

interface TemplatePickerProps {
  onSelect: (id: string) => void;
}

export default function TemplatePicker({ onSelect }: TemplatePickerProps) {
  const templates = [
    { id: "multi_doc_consistency", title: mdc.title, helper: mdc.helper },
    { id: "coming_soon", title: "Coming Soon", helper: "More templates coming soon", disabled: true },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {templates.map((tpl) => (
        <div
          key={tpl.id}
          className={`border rounded-md p-4 hover:bg-muted ${tpl.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          onClick={() => !tpl.disabled && onSelect(tpl.id)}
        >
          <h3 className="font-semibold mb-1">{tpl.title}</h3>
          <p className="text-sm text-muted-foreground">{tpl.helper}</p>
        </div>
      ))}
    </div>
  );
}
