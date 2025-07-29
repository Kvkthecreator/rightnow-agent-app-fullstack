"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { WorkspaceCreationPlan, BusinessContext } from "./OnboardingAgent";

interface Props {
  plan: WorkspaceCreationPlan;
  businessContext: BusinessContext;
  onConfirm: () => void;
  onRestart: () => void;
}

export default function WorkspaceConfirmation({
  plan,
  businessContext,
  onConfirm,
  onRestart
}: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="text-4xl mb-4">✨</div>
        <h2 className="text-2xl font-bold mb-2">Your Workspace is Ready!</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          I've analyzed your responses and created a personalized workspace plan. 
          Here's what I'll build for you:
        </p>
      </div>

      {/* Workspace Overview */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-start gap-4">
          <div className="text-3xl">🗂️</div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-blue-900 mb-2">
              {plan.basketName}
            </h3>
            <p className="text-blue-800 leading-relaxed mb-4">
              {plan.basketDescription}
            </p>
            
            {/* Key Context */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-900">Challenge:</span>
                <p className="text-blue-700 mt-1">{businessContext.challenge}</p>
              </div>
              <div>
                <span className="font-medium text-blue-900">Success:</span>
                <p className="text-blue-700 mt-1">{businessContext.successCriteria}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Documents Preview */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          📄 Documents I'll Create ({plan.documents.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plan.documents.map((doc, index) => (
            <Card key={index} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="text-2xl">
                  {doc.type === 'analysis' ? '📊' :
                   doc.type === 'strategy' ? '🎯' :
                   doc.type === 'research' ? '🔍' :
                   doc.type === 'planning' ? '📋' : '📝'}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{doc.title}</h4>
                  <Badge variant="outline" className="text-xs mb-2 capitalize">
                    {doc.type}
                  </Badge>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {doc.initialContent.substring(0, 120)}...
                  </p>
                  
                  {/* Suggested Blocks Preview */}
                  {doc.suggestedBlocks.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Suggested sections:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {doc.suggestedBlocks.slice(0, 3).map((block, blockIndex) => (
                          <Badge key={blockIndex} variant="secondary" className="text-xs">
                            {block}
                          </Badge>
                        ))}
                        {doc.suggestedBlocks.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{doc.suggestedBlocks.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Intelligence Features */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <h3 className="text-lg font-semibold mb-4 text-green-900 flex items-center gap-2">
          🧠 AI Intelligence Features
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="font-medium text-green-900 mb-1">Smart Themes</h4>
            <p className="text-sm text-green-700">
              {plan.intelligenceSeeds.themes.length} themes identified from your context
            </p>
            <div className="mt-2 space-y-1">
              {plan.intelligenceSeeds.themes.slice(0, 2).map((theme, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-white">
                  {theme}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl mb-2">🔗</div>
            <h4 className="font-medium text-green-900 mb-1">Pattern Recognition</h4>
            <p className="text-sm text-green-700">
              {plan.intelligenceSeeds.patterns.length} patterns ready for analysis
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl mb-2">🌐</div>
            <h4 className="font-medium text-green-900 mb-1">Context Network</h4>
            <p className="text-sm text-green-700">
              {plan.contextItems.length} context items for intelligent suggestions
            </p>
          </div>
        </div>
      </Card>

      {/* Magic Moment Promise */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <div className="text-center">
          <div className="text-3xl mb-3">🎪</div>
          <h3 className="text-lg font-semibold text-purple-900 mb-2">
            The Magic Moment
          </h3>
          <p className="text-purple-800 leading-relaxed">
            When I create your workspace, you'll immediately see AI-powered insights, 
            intelligent suggestions, and contextual analysis working on your actual business challenge. 
            The Brain sidebar will be active from minute one with personalized intelligence.
          </p>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={onRestart}
          className="text-sm"
        >
          ← Start Over
        </Button>

        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            This will take about 10 seconds
          </div>
          <Button
            onClick={onConfirm}
            size="lg"
            className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 px-8"
          >
            Create My Workspace ✨
          </Button>
        </div>
      </div>

      {/* Fine Print */}
      <div className="text-xs text-muted-foreground text-center">
        Your workspace will be private and secure. You can modify, delete, or recreate it anytime.
      </div>
    </div>
  );
}