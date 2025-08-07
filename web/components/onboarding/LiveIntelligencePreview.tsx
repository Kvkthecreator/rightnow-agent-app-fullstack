"use client";

import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { ProcessingResponse } from '@/lib/intelligence/useUniversalIntelligence';

interface LiveIntelligencePreviewProps {
  processingResult: ProcessingResponse | null;
  isProcessing: boolean;
  hasContent: boolean;
  className?: string;
}

export default function LiveIntelligencePreview({
  processingResult,
  isProcessing,
  hasContent,
  className
}: LiveIntelligencePreviewProps) {

  // Show placeholder when no content
  if (!hasContent) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="text-center py-8">
          <div className="text-4xl mb-3 opacity-40">🧠</div>
          <h3 className="font-medium text-sm mb-2 text-muted-foreground">
            AI Intelligence Preview
          </h3>
          <p className="text-xs text-muted-foreground">
            Add content above to see real-time AI analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (isProcessing) {
    return (
      <Card className={cn("border-primary/20 bg-primary/5", className)}>
        <CardContent className="py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
            <span className="text-sm font-medium">Analyzing content...</span>
          </div>
          <div className="space-y-2">
            {/* Loading skeleton */}
            {[1, 2, 3].map(i => (
              <div key={i} className="h-6 bg-primary/10 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state if no result but had content
  if (!processingResult) {
    return (
      <Card className={cn("border-yellow-200 bg-yellow-50", className)}>
        <CardContent className="py-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">⚠️</span>
            <span className="text-sm font-medium text-yellow-800">
              Processing content...
            </span>
          </div>
          <p className="text-xs text-yellow-700">
            Content analysis in progress. This may take a moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { intelligence, suggested_structure, processing_summary } = processingResult;

  return (
    <Card className={cn("border-green-200 bg-green-50/50", className)}>
      <CardContent className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🧠</span>
            <span className="text-sm font-medium text-green-800">
              AI Intelligence Analysis
            </span>
          </div>
          <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">
            {Math.round(intelligence.confidence_score * 100)}% confidence
          </Badge>
        </div>

        {/* Processing Summary */}
        <div className="p-3 bg-white/60 rounded-lg border border-green-200">
          <p className="text-xs text-green-700 font-medium mb-1">Analysis Summary</p>
          <p className="text-xs text-green-600">{processing_summary}</p>
        </div>

        {/* Themes */}
        {intelligence.themes.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-green-800 mb-2">Key Themes Identified</h4>
            <div className="flex flex-wrap gap-1.5">
              {intelligence.themes.slice(0, 6).map((theme, index) => (
                <Badge 
                  key={theme} 
                  variant="outline"
                  className={cn(
                    "text-xs px-2 py-1",
                    index === 0 ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/50"
                  )}
                >
                  {theme.replace('-', ' ')}
                </Badge>
              ))}
              {intelligence.themes.length > 6 && (
                <Badge variant="outline" className="text-xs px-2 py-1 bg-muted/30">
                  +{intelligence.themes.length - 6} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Suggested Basket */}
        <div>
          <h4 className="text-xs font-medium text-green-800 mb-2">Suggested Basket</h4>
          <div className="p-3 bg-white/60 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">🗂️</span>
              <span className="text-sm font-medium text-green-800">
                {suggested_structure.organization.suggested_name}
              </span>
            </div>
            <p className="text-xs text-green-600 mb-3">
              {suggested_structure.organization.description}
            </p>
            {suggested_structure.documents.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-700 mb-1">
                  Documents to create ({suggested_structure.documents.length}):
                </p>
                <div className="space-y-1">
                  {suggested_structure.documents.slice(0, 3).map(doc => (
                    <div key={doc.title} className="flex items-center gap-2">
                      <span className="text-xs">📄</span>
                      <span className="text-xs text-green-600">{doc.title}</span>
                      <Badge variant="outline" className="text-xs px-1 py-0 bg-green-100">
                        {doc.type}
                      </Badge>
                    </div>
                  ))}
                  {suggested_structure.documents.length > 3 && (
                    <div className="text-xs text-green-500 pl-4">
                      +{suggested_structure.documents.length - 3} more documents
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Patterns Found */}
        {intelligence.patterns.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-green-800 mb-2">Patterns Detected</h4>
            <div className="space-y-1.5">
              {intelligence.patterns.slice(0, 2).map((pattern, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-white/40 rounded border border-green-100">
                  <span className="text-xs mt-0.5">🔍</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-green-700 font-medium">
                      {pattern.pattern_type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-green-600">
                      {pattern.description}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs px-1 py-0 bg-green-50">
                    {Math.round(pattern.confidence * 100)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps Hint */}
        <div className="text-center pt-2 border-t border-green-200">
          <p className="text-xs text-green-600">
            ✨ Ready to create your basket
          </p>
        </div>
      </CardContent>
    </Card>
  );
}