interface LoadingSkeletonProps {
  type: 'dashboard' | 'grid' | 'list' | 'editor';
}

export function LoadingSkeleton({ type }: LoadingSkeletonProps) {
  if (type === 'dashboard') {
    return (
      <div className="flex flex-col h-full p-8 space-y-8">
        <div className="p-12 bg-gray-100 rounded-xl animate-pulse">
          <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
          <div className="h-16 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-40 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-4">
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex justify-between py-3 border-b border-gray-100">
                <div className="space-y-2">
                  <div className="h-4 w-48 bg-gray-200 rounded"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (type === 'grid') {
    return (
      <div className="p-6">
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="p-6 bg-gray-100 rounded-lg animate-pulse">
              <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-200 rounded"></div>
                <div className="h-3 w-full bg-gray-200 rounded"></div>
                <div className="h-3 w-2/3 bg-gray-200 rounded"></div>
              </div>
              <div className="flex gap-2 mt-4">
                <div className="h-6 w-12 bg-gray-200 rounded"></div>
                <div className="h-6 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (type === 'list') {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center space-x-4 p-4 bg-gray-100 rounded-lg animate-pulse">
            <div className="h-12 w-12 bg-gray-200 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (type === 'editor') {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center h-32">
      <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
    </div>
  );
}