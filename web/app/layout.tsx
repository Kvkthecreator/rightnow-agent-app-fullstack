import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { useEffect, useState } from "react";
import "./globals.css";
import SupabaseProvider from "@/components/SupabaseProvider";
import { createClient } from "@/lib/supabaseClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "rightNOW",
  description: "you need marketing agents, not a marketing team!",
  icons: {
    // Favicon placed in public/favicon.svg
    icon: '/favicon.svg',
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SupabaseProvider>
          <header className="p-4 border-b">
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/briefs">Briefs</Link>
              <Link href="/blocks">Blocks</Link>
              {/* Inbox badge */}
              <QueueLink />
            </nav>
          </header>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}

function QueueLink() {
  const supabase = createClient();
  const [count, setCount] = useState(0);

  useEffect(() => {
    supabase
      .from("block_change_queue")
      .select("id", { count: "exact" })
      .eq("status", "pending")
      .then(({ count }) => setCount(count || 0));
  }, []);

  return (
    <Link href="/blocks/queue" className="relative">
      Queue
      {count > 0 && (
        <span className="absolute -right-3 -top-2 rounded-full bg-red-600 text-white text-xs px-1">
          {count}
        </span>
      )}
    </Link>
  );
}
