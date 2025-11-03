'use client';

import { useEffect, useState } from 'react';

const IS_DEV = process.env.NODE_ENV !== 'production';

export default function RuntimeHUD() {
  const [intervals, setIntervals] = useState<number>(0);

  useEffect(() => {
    // @ts-expect-error
    window.__basketIntervals ??= 0;
    const i = // @ts-expect-error
      window.__basketIntervals;
    setIntervals(i);
    
    // Update every second to show real-time changes
    const updateInterval = setInterval(() => {
      // @ts-expect-error
      const current = window.__basketIntervals || 0;
      setIntervals(current);
    }, 1000);
    
    return () => clearInterval(updateInterval);
  }, []);

  if (!IS_DEV) return null;

  return (
    <div className="fixed bottom-2 right-2 text-xs bg-black/70 text-white px-2 py-1 rounded">
      intervals: {intervals}
    </div>
  );
}