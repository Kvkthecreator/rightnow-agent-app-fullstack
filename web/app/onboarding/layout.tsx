import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function OnboardingLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Simplified header for onboarding */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-xl font-bold text-primary">
                🧠 RightNow
              </div>
              <div className="text-sm text-muted-foreground">
                Workspace Creation
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Powered by AI
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}