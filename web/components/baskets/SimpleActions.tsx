"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Plus, FileText, MessageSquare, Zap } from "lucide-react";

interface Action {
  type: string;
  label: string;
  enabled: boolean;
}

interface SimpleActionsProps {
  basketId: string;
  actions: Action[];
}

export function SimpleActions({ basketId, actions }: SimpleActionsProps) {
  const router = useRouter();

  const handleAddContent = () => {
    router.push(`/baskets/${basketId}/add-content`);
  };

  const handleCreateDocument = () => {
    router.push(`/baskets/${basketId}/documents/new`);
  };

  const handleStrategicAnalysis = () => {
    // For now, navigate to a strategic analysis page or modal
    router.push(`/baskets/${basketId}/strategy`);
  };

  // Default actions if none provided
  const defaultActions: Action[] = [
    { type: "add_content", label: "Add Content", enabled: true },
    { type: "create_document", label: "Create Document", enabled: true },
    { type: "strategic_analysis", label: "Ask Strategy Question", enabled: true }
  ];

  const availableActions = actions && actions.length > 0 ? actions : defaultActions;

  const getActionHandler = (actionType: string) => {
    switch (actionType) {
      case "add_content":
        return handleAddContent;
      case "create_document":
        return handleCreateDocument;
      case "strategic_analysis":
        return handleStrategicAnalysis;
      default:
        return () => console.log(`Action ${actionType} not implemented`);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "add_content":
        return <Plus className="h-4 w-4" />;
      case "create_document":
        return <FileText className="h-4 w-4" />;
      case "strategic_analysis":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Quick Actions</h3>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {availableActions.slice(0, 3).map((action, index) => (
          <Button
            key={index}
            onClick={getActionHandler(action.type)}
            disabled={!action.enabled}
            variant={index === 0 ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            {getActionIcon(action.type)}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}