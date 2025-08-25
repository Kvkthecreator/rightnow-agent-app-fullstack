import { Brain, Calendar, Clock } from 'lucide-react';
import type { RecentReflectionSummary } from '@/lib/server/dashboard/queries';

interface ReflectionCardProps {
  reflection: RecentReflectionSummary | null;
  basketId: string;
}

export function ReflectionCard({ reflection, basketId }: ReflectionCardProps) {
  if (!reflection) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Latest Reflection</h2>
        </div>
        
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🤔</div>
          <p className="text-gray-600 mb-4">No reflections yet</p>
          <a
            href={`/api/baskets/${basketId}/reflections?refresh=1`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Generate First Reflection
          </a>
        </div>
      </div>
    );
  }

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSubstrateWindowDuration = (): string => {
    const start = new Date(reflection.substrate_window_start);
    const end = new Date(reflection.substrate_window_end);
    const diffHours = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) return `${diffHours}h window`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d window`;
  };

  // Truncate reflection text for preview
  const previewText = reflection.reflection_text.length > 200 
    ? `${reflection.reflection_text.substring(0, 200)}...`
    : reflection.reflection_text;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Brain className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Latest Reflection</h2>
        </div>
        
        <a 
          href={`/baskets/${basketId}/reflections`}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View all →
        </a>
      </div>
      
      <div className="space-y-4">
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700 leading-relaxed">{previewText}</p>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{formatTimestamp(reflection.computation_timestamp)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{getSubstrateWindowDuration()}</span>
            </div>
          </div>
          
          {reflection.meta?.substrate_dump_count && (
            <div className="text-sm text-gray-500">
              Based on {reflection.meta.substrate_dump_count} dumps
            </div>
          )}
        </div>
      </div>
    </div>
  );
}