"use client";
import { Button } from "@/components/ui/Button";

interface UploadButtonProps {
  onUpload: (url: string) => void;
}

export default function UploadButton({ onUpload }: UploadButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => onUpload("")}
    >
      Upload
    </Button>
  );
}
