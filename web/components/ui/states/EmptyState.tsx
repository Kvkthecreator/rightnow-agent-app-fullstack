interface EmptyStateProps {
  type: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

const emptyStateConfig = {
  blocks: {
    title: 'No memories yet',
    description: 'Blocks appear as you capture thoughts. Each memory becomes a structured piece of knowledge.',
    icon: (
      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  documents: {
    title: 'No documents yet',
    description: 'Create your first expression. Documents help you develop and share your structured thoughts.',
    icon: (
      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  insights: {
    title: 'No insights yet',
    description: 'Insights emerge from patterns in your memories. As you capture more thoughts, connections will surface.',
    icon: (
      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  },
  context: {
    title: 'No context items',
    description: 'Context items provide guidelines and relationships that shape how your memories connect.',
    icon: (
      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    )
  },
  history: {
    title: 'No history yet',
    description: 'Your journey of thought development will appear here as you work with your memories.',
    icon: (
      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
};

export function EmptyState({ type, title, description, icon, action }: EmptyStateProps) {
  const config = emptyStateConfig[type as keyof typeof emptyStateConfig] || emptyStateConfig.blocks;
  
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full mb-6 flex items-center justify-center">
        {icon || config.icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title || config.title}
      </h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        {description || config.description}
      </p>
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
}