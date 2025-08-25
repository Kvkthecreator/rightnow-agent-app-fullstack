import Link from 'next/link';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface BasketHeaderProps {
  basketId: string;
  name: string | null;
  lastActivityTs: string | null;
}

export default function BasketHeader({ basketId, name, lastActivityTs }: BasketHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b bg-white">
      <div className="flex flex-col">
        <h1 className="text-2xl font-semibold text-gray-900">
          {name || 'Untitled Basket'}
        </h1>
        {lastActivityTs && (
          <p className="text-sm text-gray-600 mt-1">
            Last activity {dayjs(lastActivityTs).fromNow()}
          </p>
        )}
        {!lastActivityTs && (
          <p className="text-sm text-gray-500 mt-1">
            No activity yet
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <Link
          href={`/baskets/${basketId}/memory`}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Memory
        </Link>
        <Link
          href={`/baskets/${basketId}/timeline`}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Timeline
        </Link>
        <Link
          href={`/baskets/${basketId}/documents`}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Documents
        </Link>
      </div>
    </div>
  );
}