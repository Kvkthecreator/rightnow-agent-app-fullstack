import { Activity, FileText, ExternalLink, Calendar, Type } from 'lucide-react';
import type { RecentDumpSummary, RecentTimelineEvent } from '@/lib/server/dashboard/queries';

interface RecentActivityCardProps {
  dumps: RecentDumpSummary[];
  timelineEvents: RecentTimelineEvent[];
  basketId: string;
}

export function RecentActivityCard({ dumps, timelineEvents, basketId }: RecentActivityCardProps) {
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getDumpPreview = (dump: RecentDumpSummary): string => {
    if (dump.text_dump) {
      const preview = dump.text_dump.substring(0, 100);
      return preview.length < dump.text_dump.length ? `${preview}...` : preview;
    }
    if (dump.file_url) {
      const filename = dump.file_url.split('/').pop() || 'File';
      return `📎 ${filename}`;
    }
    return 'Empty dump';
  };

  const getEventIcon = (eventType: string): React.ReactNode => {
    switch (eventType) {
      case 'dump.created':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'reflection.computed':
        return <Activity className="h-4 w-4 text-purple-600" />;
      case 'delta.applied':
        return <Type className="h-4 w-4 text-green-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const hasActivity = dumps.length > 0 || timelineEvents.length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Activity className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        
        <a 
          href={`/baskets/${basketId}/timeline`}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View timeline →
        </a>
      </div>
      
      {!hasActivity ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-gray-600 mb-4">No recent activity</p>
          <a
            href={`/baskets/${basketId}/overview`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Content
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Recent Dumps */}
          {dumps.slice(0, 2).map((dump) => (
            <div key={dump.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <FileText className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Content added</p>
                  <span className="text-xs text-gray-500">{formatTimestamp(dump.created_at)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1 truncate">
                  {getDumpPreview(dump)}
                </p>
                <div className="text-xs text-gray-500 mt-1">
                  {dump.char_count.toLocaleString()} characters
                </div>
              </div>
              {dump.file_url && (
                <a
                  href={dump.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          ))}
          
          {/* Recent Timeline Events */}
          {timelineEvents.slice(0, 3).map((event) => (
            <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              {getEventIcon(event.event_type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {event.event_type.replace('.', ' ')}
                  </p>
                  <span className="text-xs text-gray-500">{formatTimestamp(event.created_at)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {event.preview}
                </p>
              </div>
            </div>
          ))}
          
          {(dumps.length > 2 || timelineEvents.length > 3) && (
            <div className="text-center pt-2">
              <a
                href={`/baskets/${basketId}/timeline`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View {Math.max(dumps.length, timelineEvents.length) - 2} more activities
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}