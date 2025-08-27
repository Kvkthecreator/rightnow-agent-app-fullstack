'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function BootstrapErrorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRetry() {
    setLoading(true);
    // Simply redirect back to welcome page which will retry the basket creation
    router.replace('/welcome');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-xl font-semibold">Setup Error</h1>
      <p className="text-muted-foreground">We couldn't complete your setup. Please try again.</p>
      <button
        onClick={handleRetry}
        disabled={loading}
        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Retrying...' : 'Try again'}
      </button>
    </div>
  );
}
