import { Activity, TrendingUp, Clock, FileText } from 'lucide-react';
import type { BasketHealthMetrics } from '@/lib/server/dashboard/queries';

interface BasketHeaderProps {
  basketName: string;
  health: BasketHealthMetrics;
}

export function BasketHeader({ basketName, health }: BasketHeaderProps) {
  const getHealthColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getHealthLabel = (score: number): string => {
    if (score >= 80) return 'Active';
    if (score >= 60) return 'Moderate';
    if (score >= 40) return 'Low Activity';
    return 'Inactive';
  };

  const formatLastActivity = (timestamp: string | null): string => {
    if (!timestamp) return 'No activity';
    
    const now = new Date();
    const activity = new Date(timestamp);
    const diffHours = Math.floor((now.getTime() - activity.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return activity.toLocaleDateString();
  };

  const lastActivity = health.latest_dump_at || health.latest_reflection_at;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">{basketName}</h1>
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>{health.dump_count} dumps</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>{health.reflection_count} reflections</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Last active {formatLastActivity(lastActivity)}</span>
            </div>
          </div>
        </div>
        
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${getHealthColor(health.activity_score)}`}>
          <Activity className="h-4 w-4" />
          <span className="font-medium">{getHealthLabel(health.activity_score)}</span>
          <span className="text-xs">({health.activity_score}%)</span>
        </div>
      </div>
      
      {health.total_chars > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{health.total_chars.toLocaleString()}</span> characters of content
          </div>
        </div>
      )}
    </div>
  );
}