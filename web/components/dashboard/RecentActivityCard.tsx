import Link from 'next/link';
import UnifiedTimeline from '@/components/timeline/UnifiedTimeline';

interface RecentActivityCardProps {
  basketId: string;
}

export default function RecentActivityCard({ basketId }: RecentActivityCardProps) {
  return (
    <div className="bg-white rounded-lg border">
      <div className="flex items-center justify-between p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <Link
          href={`/baskets/${basketId}/timeline`}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View all →
        </Link>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        <UnifiedTimeline 
          basketId={basketId} 
          className="p-0"
          maxItems={20}
        />
      </div>
    </div>
  );
}