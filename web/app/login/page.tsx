"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";
import Brand from "@/components/Brand";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // If already signed in, redirect immediately
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/dashboard");
      }
    });
  }, [router, supabase]);

  // Google OAuth
  const handleGoogleLogin = async () => {
    // Preserve the current path so we can restore it after OAuth
    if (typeof window !== "undefined") {
      localStorage.setItem("postLoginPath", window.location.pathname);
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      console.error("Error logging in with Google:", error.message);
    }
  };

  // Dev-only Magic Link Login
  const handleMagicLinkLogin = async () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("postLoginPath", window.location.pathname);
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setErrorMsg(error.message);
    } else {
      setSent(true);
    }
  };

  const showDevMagicLogin = process.env.NODE_ENV === "development";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted p-4">
      {/* Branding */}
      <div className="flex items-center space-x-2 mb-6">
        <Brand className="text-2xl" />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm rounded-lg shadow-sm p-6 bg-card space-y-4">
        <h2 className="text-2xl font-bold text-center">Welcome back</h2>

        <div className="flex items-center">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="px-2 text-sm text-gray-500">continue with</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <Button onClick={handleGoogleLogin} className="w-full">
          <span className="mr-2 text-xl font-bold">G</span>
          Login with Google
        </Button>

        {showDevMagicLogin && (
          <div className="space-y-2 pt-4 border-t border-gray-200">
            <label className="text-sm font-medium">Dev Magic Link Login</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
              placeholder="test@example.com"
            />
            <Button onClick={handleMagicLinkLogin} className="w-full">
              Send Magic Link
            </Button>
            {sent && (
              <p className="text-sm text-green-600">
                ✅ Magic link sent! Check your inbox.
              </p>
            )}
            {errorMsg && (
              <p className="text-sm text-red-500">Error: {errorMsg}</p>
            )}
          </div>
        )}
      </div>

      {/* Policy Links */}
      <p className="text-sm font-medium text-center mt-4">
        By clicking continue, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-gray-700">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-gray-700">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
