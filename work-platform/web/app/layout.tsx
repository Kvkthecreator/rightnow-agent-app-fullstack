import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import "../styles/diff.css";

import DumpModalWrapper from "@/components/DumpModalWrapper";
import ClientLayoutShell from "@/components/shell/ClientLayoutShell";

// ✅ NEW: Import SupabaseProvider
import { SupabaseProvider } from "@/components/SupabaseProvider";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import Providers from "./providers";
import { GlobalErrorBoundary } from "./GlobalErrorBoundary";
import { RequestBoundary } from "@/components/RequestBoundary";

// Environment validation
import { validateEnvironment, logEnvironmentInfo } from "@/lib/config/validate";

// Run validation on initialization
if (typeof window !== "undefined") {
  try {
    validateEnvironment();
    logEnvironmentInfo();
  } catch (error) {
    console.error("Environment validation failed:", error);
  }
}

const geistSans = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});
// Pacifico font is now loaded via @font-face in globals.css

const themeInitScript = `
(function() {
  try {
    var storageKey = 'yarnnn-theme';
    var stored = window.localStorage.getItem(storageKey);
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (error) {
    console.warn('theme init failed', error);
  }
})();
`;

export const metadata: Metadata = {
  title: "yarnnn",
  description: "weave your ideas with AI",
  icons: {
    icon: "/favicon.svg",
  },
};

// Build timestamp for verification
const BUILD_STAMP = new Date().toISOString();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className="antialiased min-h-screen">
        <GlobalErrorBoundary>
          <Providers>
            <SupabaseProvider>
              <NotificationProvider>
                <RequestBoundary>
                  <ClientLayoutShell>{children}</ClientLayoutShell>
                </RequestBoundary>
                <DumpModalWrapper />
              </NotificationProvider>
            </SupabaseProvider>
          </Providers>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
