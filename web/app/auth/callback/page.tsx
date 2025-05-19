"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    async function handleAuth() {
      try {
        // Exchange the OAuth code in the URL for a session and persist it
        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
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
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p>Redirecting...</p>
    </div>
  );
}