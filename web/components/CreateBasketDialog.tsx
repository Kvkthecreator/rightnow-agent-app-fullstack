"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/Button";
import { useCreateBasket } from "@/hooks/useCreateBasket";
import { toast } from "react-hot-toast";

export interface CreateBasketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateBasketDialog({
  open,
  onOpenChange,
}: CreateBasketDialogProps) {
  const router = useRouter();
  const { mutate } = useCreateBasket();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [basketName, setBasketName] = useState("");
  const [templateSlug, setTemplateSlug] = useState<"brand_playbook" | "blank">(
    "brand_playbook",
  );
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    try {
      setLoading(true);
      const id = await mutate(basketName, templateSlug);
      router.push(`/baskets/${id}/work`);
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to create basket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Basket</DialogTitle>
        </DialogHeader>

        <div className={step === 0 ? "space-y-4" : "hidden"}>
          <label className="text-sm font-medium">Basket Name</label>
          <Input
            autoFocus
            value={basketName}
            onChange={(e) => setBasketName(e.target.value)}
          />
        </div>

        <div className={step === 1 ? "space-y-4" : "hidden"}>
          <RadioGroup
            value={templateSlug}
            onValueChange={(v) =>
              setTemplateSlug(v as "brand_playbook" | "blank")
            }
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="brand_playbook" id="tpl-brand" />
              <label htmlFor="tpl-brand" className="text-sm">
                Brand Playbook
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="blank" id="tpl-blank" />
              <label htmlFor="tpl-blank" className="text-sm">
                Blank Basket
              </label>
            </div>
          </RadioGroup>
        </div>

        <div className={step === 2 ? "space-y-4 text-center" : "hidden"}>
          <p>Drag files here — coming soon</p>
          <Button
            variant="ghost"
            type="button"
            onClick={handleCreate}
            disabled={loading}
          >
            Skip for now
          </Button>
        </div>

        <DialogFooter className="pt-4">
          {step > 0 && (
            <Button
              variant="ghost"
              type="button"
              onClick={() => setStep((s) => (s > 0 ? (s - 1) as 0 | 1 | 2 : s))}
            >
              Back
            </Button>
          )}
          {step < 2 ? (
            <Button
              onClick={() => setStep((s) => (s + 1) as 0 | 1 | 2)}
              disabled={basketName.trim() === "" || loading}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={basketName.trim() === "" || loading}
            >
              {loading ? "Creating…" : "Create Basket"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
