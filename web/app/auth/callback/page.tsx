"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();

  useEffect(() => {
    async function handleAuth() {
      try {
        // Exchange the OAuth code in the URL for a session and persist it
        // Handle OAuth code exchange and session restoration
        const { data: { session }, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
        if (error || !session) {
          console.error('Error exchanging code for session:', error);
          router.replace('/login');
        } else {
          // Redirect to profile page on current domain
          router.replace('/profile');
        }
      } catch (err) {
        console.error('Error handling auth callback:', err);
        router.replace('/login');
      }
    }
    handleAuth();
  }, [router, supabase]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Redirecting...</p>
    </div>
  );
}