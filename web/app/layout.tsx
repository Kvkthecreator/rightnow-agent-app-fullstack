import type { Metadata } from "next";
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import "./globals.css";
import "../styles/diff.css";

import { BasketProvider } from "@/lib/context/BasketContext";
import DumpModalWrapper from "@/components/DumpModalWrapper";
import { Toaster } from "react-hot-toast";
import ClientLayoutShell from "@/components/shell/ClientLayoutShell";

// ✅ NEW: Import SupabaseProvider
import { SupabaseProvider } from "@/components/SupabaseProvider";
import Providers from "./providers";
import { GlobalErrorBoundary } from "./GlobalErrorBoundary";
import { RequestBoundary } from "@/components/RequestBoundary";

// Environment validation
import { validateEnvironment, logEnvironmentInfo } from "@/lib/config/validate";

// Run validation on initialization
if (typeof window !== 'undefined') {
  try {
    validateEnvironment();
    logEnvironmentInfo();
  } catch (error) {
    console.error('Environment validation failed:', error);
  }
}

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});
const pacifico = Pacifico({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pacifico",
});

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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable}`}
    >
      <body className="antialiased min-h-screen">
        <GlobalErrorBoundary>
          <Providers>
            <SupabaseProvider>
              <BasketProvider>
                <RequestBoundary>
                  <ClientLayoutShell>{children}</ClientLayoutShell>
                </RequestBoundary>
                <DumpModalWrapper />
              </BasketProvider>
            </SupabaseProvider>
            <Toaster position="top-right" />
          </Providers>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
