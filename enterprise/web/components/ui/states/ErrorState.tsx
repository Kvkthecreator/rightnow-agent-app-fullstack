interface ErrorStateProps {
  error: Error;
  retry?: () => void;
  title?: string;
  description?: string;
}

export function ErrorState({ error, retry, title, description }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-20 h-20 bg-red-100 rounded-full mb-6 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 18.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title || 'Something went wrong'}
      </h3>
      
      <p className="text-sm text-gray-500 max-w-sm mb-2">
        {description || 'We encountered an error while loading this content.'}
      </p>
      
      <details className="text-xs text-gray-400 mb-6">
        <summary className="cursor-pointer hover:text-gray-600 mb-2">
          Technical details
        </summary>
        <code className="block bg-gray-100 p-2 rounded text-left whitespace-pre-wrap">
          {error.message}
        </code>
      </details>
      
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
        >
          Try again
        </button>
      )}
    </div>
  );
}