import { Suspense } from "react";
import LoginClient from "./LoginClient";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-4xl mx-auto grid gap-6 md:grid-cols-[1.2fr_1fr] items-start">
        <div className="hidden md:flex flex-col gap-4 rounded-xl border border-neutral-200 bg-neutral-50 px-6 py-8 text-sm leading-relaxed text-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900">Onboarding checklist</h2>
          <ol className="space-y-3 list-decimal pl-5">
            <li><span className="font-medium">Sign in</span> with your Yarnnn workspace owner account.</li>
            <li><span className="font-medium">Generate an integration token</span> from Integrations settings after you land in the Control Tower.</li>
            <li><span className="font-medium">Paste the token into Claude</span> (Desktop or claude.ai → Remote MCP) and begin capturing ambient context.</li>
            <li><span className="font-medium">ChatGPT Apps</span> support is in preview—review the guide and be ready when the beta opens.</li>
          </ol>
          <div className="flex flex-col gap-2 text-xs font-medium uppercase tracking-wide">
            <a
              href="/docs/integrations/claude"
              className="inline-flex w-fit items-center justify-center rounded-lg border border-neutral-400 px-4 py-2 hover:bg-white"
            >
              Claude integration guide
            </a>
            <a
              href="/docs/integrations/chatgpt"
              className="inline-flex w-fit items-center justify-center rounded-lg border border-dashed border-neutral-400 px-4 py-2 hover:bg-white"
            >
              ChatGPT preview notes
            </a>
          </div>
        </div>

        <div className="w-full max-w-sm justify-self-center bg-card border rounded-xl shadow-sm px-6 py-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground text-center">
              Continue to <span className="font-medium">yarnnn</span>
            </p>
          </div>

          {/* Login button */}
          <Suspense
            fallback={
              <div className="text-center text-sm text-muted-foreground">
                Loading login options...
              </div>
            }
          >
            <LoginClient />
          </Suspense>

          {/* Footer links */}
          <p className="text-xs text-center text-muted-foreground leading-relaxed">
            By continuing, you agree to our{' '}
            <Link
              href="/terms"
              className="underline underline-offset-2 hover:text-primary transition-colors"
            >
              Terms
            </Link>{' '}
            and{' '}
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
    </div>
  );
}
