"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Plus, FileText, MessageSquare, Zap, Upload, Search, BarChart3, Target, FileIcon } from "lucide-react";

interface Action {
  type: string;
  label: string;
  enabled: boolean;
  primary?: boolean;
}

interface SimpleActionsProps {
  basketId: string;
  actions: Action[];
}

export function SimpleActions({ basketId, actions }: SimpleActionsProps) {
  const router = useRouter();

  const handleAction = (actionType: string) => {
    switch (actionType) {
      case 'add_first_content':
      case 'add_content':
        router.push(`/create?basketId=${basketId}`);
        break;
      case 'import_files':
        router.push(`/create?basketId=${basketId}&mode=import`);
        break;
      case 'start_template':
        router.push(`/create?basketId=${basketId}&mode=template`);
        break;
      case 'create_document':
        router.push(`/baskets/${basketId}/documents/new`);
        break;
      case 'analyze_deeper':
        router.push(`/baskets/${basketId}/work/documents`);
        break;
      case 'create_synthesis':
        router.push(`/baskets/${basketId}/documents/new?type=synthesis`);
        break;
      case 'find_gaps':
        router.push(`/baskets/${basketId}/work`);
        break;
      case 'strategic_planning':
        router.push(`/baskets/${basketId}/strategy`);
        break;
      case 'strategic_analysis':
        router.push(`/baskets/${basketId}/work/documents`);
        break;
      default:
        console.warn('Unknown action type:', actionType);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'add_first_content':
      case 'add_content':
        return <Plus className="h-4 w-4" />;
      case 'import_files':
        return <Upload className="h-4 w-4" />;
      case 'start_template':
        return <FileIcon className="h-4 w-4" />;
      case 'create_document':
      case 'create_synthesis':
        return <FileText className="h-4 w-4" />;
      case 'analyze_deeper':
      case 'find_gaps':
        return <Search className="h-4 w-4" />;
      case 'strategic_planning':
        return <Target className="h-4 w-4" />;
      case 'strategic_analysis':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  // If no actions provided, show default fallback
  const displayActions = actions && actions.length > 0 ? actions : [
    { type: "add_content", label: "Add Content", enabled: true, primary: true },
    { type: "create_document", label: "Create Document", enabled: true },
    { type: "strategic_analysis", label: "Strategic Analysis", enabled: true }
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Quick Actions</h3>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {displayActions.slice(0, 3).map((action) => (
          <Button
            key={action.type}
            onClick={() => handleAction(action.type)}
            disabled={!action.enabled}
            variant={action.primary ? "default" : "outline"}
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