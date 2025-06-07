"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";


export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  // If already signed in, redirect immediately
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/dashboard");
      }
    });
  }, [router, supabase]);

  // Handler for your “Login with Google” button
  const handleGoogleLogin = async () => {
    // Redirect to our auth callback after Google sign-in using dynamic site URL
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      console.error("Error logging in with Google:", error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted p-4">
      {/* Branding */}
      <div className="flex items-center space-x-2 mb-6">
        <img
          src="/assets/logos/yarn-logo-light.png"
          alt="yarnnn logo"
          className="h-8 w-8"
        />
        <span className="text-2xl font-brand">yarnnn</span>
      </div>
      {/* Login Card */}
      <div className="w-full max-w-sm rounded-lg shadow-sm p-6 bg-card">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Welcome back</h2>
          <div className="flex items-center">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="px-2 text-sm text-gray-500">Or continue with</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <Button onClick={handleGoogleLogin} className="w-full">
            <span className="mr-2 text-xl font-bold">G</span>
            Login with Google
          </Button>
        </div>
      </div>
      {/* Policy Links */}
      <p className="text-sm font-medium text-center mt-4">
        By clicking continue, you agree to our{' '}
        <Link href="/terms" className="underline hover:text-gray-700">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline hover:text-gray-700">
          Privacy Policy
        </Link>.
      </p>
    </div>
  );
}