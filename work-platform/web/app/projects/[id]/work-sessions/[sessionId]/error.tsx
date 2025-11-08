'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Work Session Detail Error]', error);
  }, [error]);

  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="max-w-lg p-8 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="rounded-full bg-red-100 dark:bg-red-950 p-4">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Something went wrong
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              We encountered an error while loading this work session. This could be due to a
              network issue or a problem with the session data.
            </p>
          </div>

          {error.message && (
            <div className="w-full rounded-lg bg-slate-50 dark:bg-slate-900 p-3 text-left">
              <p className="text-sm font-mono text-slate-700 dark:text-slate-300">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
            <Button
              onClick={reset}
              className="flex-1 inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              asChild
              className="flex-1"
            >
              <Link href="../work-sessions" className="inline-flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Sessions
              </Link>
            </Button>
          </div>

          {error.digest && (
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
