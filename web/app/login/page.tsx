"use client";

import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12">
      {/* Logo + Tagline */}
      <div className="space-y-2 text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight">yarnnn</h1>
        <p className="text-muted-foreground text-sm">
          Your evolving creative memory. Log in to continue.
        </p>
      </div>

      {/* Login card */}
      <div className="bg-card border rounded-xl w-full max-w-sm px-6 py-8 shadow-md space-y-4">
        <Suspense
          fallback={
            <div className="text-center text-sm text-muted-foreground">
              Loading login...
            </div>
          }
        >
          <LoginClient />
        </Suspense>
      </div>

      {/* Footer Links */}
      <p className="text-xs text-muted-foreground mt-6 text-center px-4">
        By continuing, you agree to our{" "}
        <a
          href="/terms"
          className="underline hover:text-primary transition"
        >
          Terms
        </a>{" "}
        and{" "}
        <a
          href="/privacy"
          className="underline hover:text-primary transition"
        >
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}
