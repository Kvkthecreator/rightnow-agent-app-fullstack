import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface DocItem {
  id: string;
  title: string;
  updated_at: string;
  preview: string;
}

interface DocsListProps {
  items: DocItem[];
}

export default function DocsList({ items }: DocsListProps) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">No documents</p>;
  }
  return (
    <div className="space-y-4">
      {items.map((doc) => (
        <Card key={doc.id} className="rounded-xl border shadow-sm">
          <div className="p-4">
            <h3 className="font-medium text-sm mb-2">{doc.title}</h3>
            <p className="text-xs text-muted-foreground">
              {new Date(doc.updated_at).toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {doc.preview}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
