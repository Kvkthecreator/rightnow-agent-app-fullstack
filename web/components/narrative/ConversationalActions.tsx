"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { 
  Lightbulb, 
  MessageCircle, 
  Target, 
  TrendingUp, 
  FileText,
  Plus,
  RefreshCw,
  Download,
  Share
} from "lucide-react";
import { formatActionButton } from "@/lib/narrative/utils/narrativeFormatting";

interface ConversationalAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  primary?: boolean;
  onClick: () => void;
}

interface ConversationalActionsProps {
  basketId: string;
  actions?: Array<{
    type: string;
    label: string;
    enabled: boolean;
    primary?: boolean;
  }>;
  onCaptureInsight?: () => void;
  onAskQuestion?: () => void;
  onExploreGuidance?: () => void;
  onViewProgress?: () => void;
  onRefreshUnderstanding?: () => void;
  className?: string;
}

export function ConversationalActions({
  basketId,
  actions = [],
  onCaptureInsight,
  onAskQuestion,
  onExploreGuidance,
  onViewProgress,
  onRefreshUnderstanding,
  className = ""
}: ConversationalActionsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleAction = async (actionId: string, callback?: () => void) => {
    if (!callback) return;
    
    setIsLoading(actionId);
    try {
      await callback();
    } finally {
      setIsLoading(null);
    }
  };

  // Default conversational actions
  const defaultActions: ConversationalAction[] = [
    {
      id: 'capture-insight',
      label: 'Capture Insight',
      description: 'Share a discovery, idea, or important information',
      icon: <Lightbulb className="h-4 w-4" />,
      variant: 'default',
      primary: true,
      disabled: !onCaptureInsight,
      onClick: () => handleAction('capture-insight', onCaptureInsight)
    },
    {
      id: 'ask-question',
      label: 'Ask Me Anything',
      description: 'Get answers about your project',
      icon: <MessageCircle className="h-4 w-4" />,
      variant: 'outline',
      disabled: !onAskQuestion,
      onClick: () => handleAction('ask-question', onAskQuestion)
    },
    {
      id: 'explore-guidance',
      label: 'Get Guidance',
      description: 'Explore strategic recommendations',
      icon: <Target className="h-4 w-4" />,
      variant: 'outline',
      disabled: !onExploreGuidance,
      onClick: () => handleAction('explore-guidance', onExploreGuidance)
    },
    {
      id: 'view-progress',
      label: 'See Progress',
      description: 'Review understanding and growth',
      icon: <TrendingUp className="h-4 w-4" />,
      variant: 'ghost',
      size: 'sm',
      disabled: !onViewProgress,
      onClick: () => handleAction('view-progress', onViewProgress)
    }
  ];

  // Transform legacy actions to conversational actions
  const legacyActions: ConversationalAction[] = actions.map((action, index) => ({
    id: `legacy-${index}`,
    label: formatActionButton(action.label),
    description: `${action.type} action`,
    icon: getActionIcon(action.type),
    variant: action.primary ? 'default' : 'outline',
    disabled: !action.enabled,
    onClick: () => {
      console.log(`Legacy action: ${action.type}`);
      // TODO: Connect to legacy action handlers
    }
  }));

  const allActions = [...defaultActions, ...legacyActions];
  const primaryActions = allActions.filter(a => a.primary || a.variant === 'default');
  const secondaryActions = allActions.filter(a => !a.primary && a.variant !== 'default');

  return (
    <div className={`conversational-actions space-y-4 ${className}`}>
      {/* Primary Actions */}
      {primaryActions.length > 0 && (
        <div className="primary-actions">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Ready to continue?</h4>
          <div className="flex flex-wrap gap-2">
            {primaryActions.map((action) => (
              <ActionButton
                key={action.id}
                action={action}
                isLoading={isLoading === action.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Secondary Actions */}
      {secondaryActions.length > 0 && (
        <div className="secondary-actions">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Or explore:</h4>
          <div className="flex flex-wrap gap-2">
            {secondaryActions.map((action) => (
              <ActionButton
                key={action.id}
                action={action}
                isLoading={isLoading === action.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Utility Actions */}
      <div className="utility-actions border-t pt-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Understanding your project since {new Date().toLocaleDateString()}
          </div>
          <div className="flex gap-2">
            {onRefreshUnderstanding && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction('refresh', onRefreshUnderstanding)}
                disabled={isLoading === 'refresh'}
                className="text-xs"
              >
                {isLoading === 'refresh' ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                Refresh
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  action: ConversationalAction;
  isLoading?: boolean;
}

function ActionButton({ action, isLoading }: ActionButtonProps) {
  return (
    <Button
      variant={action.variant}
      size={action.size}
      disabled={action.disabled || isLoading}
      onClick={action.onClick}
      className="flex items-center gap-2"
      title={action.description}
    >
      {isLoading ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        action.icon
      )}
      {action.label}
    </Button>
  );
}

function getActionIcon(actionType: string): React.ReactNode {
  const iconMap: Record<string, React.ReactNode> = {
    'create': <Plus className="h-4 w-4" />,
    'edit': <FileText className="h-4 w-4" />,
    'analyze': <Target className="h-4 w-4" />,
    'guidance': <Target className="h-4 w-4" />,
    'insight': <Lightbulb className="h-4 w-4" />,
    'question': <MessageCircle className="h-4 w-4" />,
    'progress': <TrendingUp className="h-4 w-4" />,
    'export': <Download className="h-4 w-4" />,
    'share': <Share className="h-4 w-4" />
  };
  
  return iconMap[actionType.toLowerCase()] || <FileText className="h-4 w-4" />;
}

export default ConversationalActions;