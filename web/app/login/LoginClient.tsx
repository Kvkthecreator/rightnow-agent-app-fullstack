"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/clients";
import { Button } from "@/components/ui/Button";
import Brand from "@/components/Brand";

const supabase = createBrowserClient();

export default function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const showDevMagicLogin = process.env.NODE_ENV === "development";

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://yarnnn.com/auth/callback",
      },
    });
    if (error) console.error("Google login error:", error.message);
  };

  const handleMagicLinkLogin = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: "https://yarnnn.com/auth/callback",
      },
    });
    if (error) setErrorMsg(error.message);
    else setSent(true);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Brand />
      <Button onClick={handleGoogleLogin} className="w-full">Continue with Google</Button>
      {showDevMagicLogin && (
        <div className="w-full space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded-md p-2 w-full text-center"
            placeholder="Email for magic link"
          />
          <Button onClick={handleMagicLinkLogin} className="w-full">Send Magic Link</Button>
        </div>
      )}
      {sent && <p className="text-green-600 text-center text-sm">Check your email!</p>}
      {errorMsg && <p className="text-red-600 text-center text-sm">{errorMsg}</p>}
    </div>
  );
}
