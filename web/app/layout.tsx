import type { Metadata } from "next";
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import "./globals.css";
import SupabaseProvider from "@/components/SupabaseProvider";
import { Toaster } from "react-hot-toast";
import AppLayout from "@/components/layout/AppLayout";
import DumpModalWrapper from "@/components/DumpModalWrapper";
import { BasketProvider } from "@/lib/context/BasketContext";

// Font setup
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

// Metadata
export const metadata: Metadata = {
  title: "yarnnn",
  description: "weave your ideas with AI",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans?.variable || ""} ${geistMono?.variable || ""} ${pacifico?.variable || ""}`}
    >
      <body className="antialiased min-h-screen">
        <BasketProvider>
          <AppLayout>
            <SupabaseProvider>{children}</SupabaseProvider>
          </AppLayout>
          <DumpModalWrapper />
        </BasketProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
