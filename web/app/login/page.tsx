import { Suspense } from "react";
import LoginClient from "./LoginClient";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-sm bg-card border rounded-xl shadow-sm px-6 py-8 space-y-6">
        {/* Logo + Header */}
        <div className="flex flex-col items-center space-y-2">
          <div className="text-3xl font-semibold">🧶</div>
          <h2 className="text-xl font-semibold">Sign in</h2>
          <p className="text-sm text-muted-foreground text-center">
            to continue to <span className="font-medium">yarnnn</span>
          </p>
        </div>

        {/* Login button */}
        <Suspense
          fallback={
            <div className="text-center text-sm text-muted-foreground">
              Loading login...
            </div>
          }
        >
          <LoginClient />
        </Suspense>

        {/* Footer links */}
        <p className="text-xs text-center text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link
            href="/terms"
            className={cn(buttonVariants({ variant: "link", size: "sm" }), "px-0 text-xs")}
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className={cn(buttonVariants({ variant: "link", size: "sm" }), "px-0 text-xs")}
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
