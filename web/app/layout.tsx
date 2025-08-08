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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable}`}
    >
      <body className="antialiased min-h-screen">
        <SupabaseProvider>
          <BasketProvider>
            <ClientLayoutShell>{children}</ClientLayoutShell>
            <DumpModalWrapper />
          </BasketProvider>
        </SupabaseProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
