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
    <div className="space-y-2">
      {items.map((doc) => (
        <Card key={doc.id}>
          <CardHeader>
            <CardTitle>{doc.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {new Date(doc.updated_at).toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {doc.preview}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
