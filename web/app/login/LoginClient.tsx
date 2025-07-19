"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";
import Brand from "@/components/Brand";

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
    <div className="p-8 max-w-md mx-auto">
      <Brand />
      <Button onClick={handleGoogleLogin}>Continue with Google</Button>
      {showDevMagicLogin && (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-4 border p-2 w-full"
            placeholder="Email for magic link"
          />
          <Button onClick={handleMagicLinkLogin}>Send Magic Link</Button>
        </>
      )}
      {sent && <p className="text-green-600 mt-2">Check your email!</p>}
      {errorMsg && <p className="text-red-600 mt-2">{errorMsg}</p>}
    </div>
  );
}
