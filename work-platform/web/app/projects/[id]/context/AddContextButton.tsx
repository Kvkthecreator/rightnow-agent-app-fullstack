"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { AddContextModal } from "@/components/context/AddContextModal";

interface AddContextButtonProps {
  projectId: string;
  basketId: string;
}

export default function AddContextButton({ projectId, basketId }: AddContextButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button onClick={() => setShowModal(true)}>
        <Plus className="h-4 w-4 mr-1.5" />
        Add Context
      </Button>

      <AddContextModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        projectId={projectId}
        basketId={basketId}
        onSuccess={() => {
          setShowModal(false);
        }}
        onStartPolling={() => {
          // Context blocks client handles its own polling
        }}
      />
    </>
  );
}
