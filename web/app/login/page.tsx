import { Suspense } from "react";
import LoginClient from "./LoginClient";
import Link from "next/link";
import Image from "next/image";
import YarnLogo from "@/public/logo/yarnnn-mark.svg"; // or your actual asset path

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card border rounded-xl shadow-sm px-6 py-10 space-y-6 flex flex-col items-center">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
          <p className="text-sm text-muted-foreground">
            Continue to <span className="font-medium">yarnnn</span>
          </p>
        </div>

        {/* Logo */}
        <div className="w-12 h-12 my-2">
          <Image
            src={YarnLogo}
            alt="Yarnnn logo"
            width={48}
            height={48}
            className="mx-auto"
            priority
          />
        </div>

        {/* Login button */}
        <div className="w-full">
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

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          By continuing, you agree to our{" "}
          <Link
            href="/terms"
            className="underline underline-offset-2 hover:text-primary transition-colors"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-2 hover:text-primary transition-colors"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
