'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function BootstrapErrorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRetry() {
    setLoading(true);
    await fetch('/api/baskets/resolve', { method: 'POST' });
    router.replace('/welcome');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p>We couldn't finish setup.</p>
      <button
        onClick={handleRetry}
        disabled={loading}
        className="px-4 py-2 border rounded"
      >
        Try again
      </button>
    </div>
  );
}
