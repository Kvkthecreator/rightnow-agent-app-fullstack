"use client";

import { useState } from "react";
import { UploadArea } from "@/components/ui/UploadArea";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";

export interface DumpAreaProps {
  text?: string;
  onTextChange?: (v: string) => void;
  files?: string[];
  onFilesChange?: (v: string[]) => void;
  links?: string[];
  onLinksChange?: (v: string[]) => void;
}

export default function DumpArea({
  text: textProp,
  onTextChange,
  files: filesProp,
  onFilesChange,
  links: linksProp,
  onLinksChange,
}: DumpAreaProps = {}) {
  const [text, setText] = useState(textProp || "");
  const [files, setFiles] = useState<string[]>(filesProp || []);
  const [links, setLinks] = useState<string[]>(linksProp || []);

  return (
    <Card className="p-4 w-full max-w-3xl mx-auto mt-6">
      <CardContent className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">🧠 Dump your thoughts here</h2>
          <p className="text-sm text-muted-foreground">
            Paste chats, upload images/docs, or drop links.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dump-text">Raw Text Dump</Label>
          <Textarea
            id="dump-text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              onTextChange?.(e.target.value);
            }}
            placeholder="e.g. ChatGPT said to run a 7-day campaign..."
            rows={6}
          />
        </div>

        <div className="space-y-2">
          <Label>Reference Files</Label>
          <UploadArea
            prefix="dump"
            maxFiles={5}
            onUpload={(url) => {
              const next = [...files, url];
              setFiles(next);
              onFilesChange?.(next);
            }}
            preview
            enableDrop
            showPreviewGrid
          />
          {files.length === 0 ? (
            <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {files.map((url, idx) => (
                <Badge key={idx} variant="secondary">
                  📎 {url.split("/").pop()}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Relevant Links</Label>
          <Input
            type="text"
            placeholder="Paste a link and press Enter"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const url = (e.target as HTMLInputElement).value.trim();
                if (url) {
                  const next = [...links, url];
                  setLinks(next);
                  onLinksChange?.(next);
                  (e.target as HTMLInputElement).value = "";
                }
              }
            }}
          />
          {links.length === 0 ? (
            <p className="text-sm text-muted-foreground">No links added yet.</p>
          ) : (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {links.map((link, idx) => (
                <li key={idx} className="truncate">
                  🔗 <Badge variant="outline">{link}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
