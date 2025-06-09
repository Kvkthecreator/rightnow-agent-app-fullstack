"use client";
import { useState } from "react";
import DumpArea from "@/components/ui/DumpArea";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { createBasketFromDump } from "@/lib/baskets/createFromDump";
import { toast } from "react-hot-toast";

export default function BasketNewPage() {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!text.trim() && files.length === 0 && links.length === 0) {
      toast.error("Please provide some content for the dump");
      return;
    }
    setLoading(true);
    try {
      const { id } = await createBasketFromDump({
        textDump: text,
        files,
        links,
      });
      router.push(`/baskets/${id}`);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to create basket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 py-10 space-y-4">
      <DumpArea
        text={text}
        onTextChange={setText}
        files={files}
        onFilesChange={setFiles}
        links={links}
        onLinksChange={setLinks}
      />
      <div className="max-w-3xl mx-auto">
        <Button className="w-full" onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating…" : "Create Basket"}
        </Button>
      </div>
    </div>
  );
}
