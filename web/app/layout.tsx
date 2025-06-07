import type { Metadata } from "next";
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import SupabaseProvider from "@/components/SupabaseProvider";
import QueueLink from "@/components/QueueLink";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pacifico = Pacifico({
  variable: "--font-pacifico",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "yarnnn",
  description: "weave your ideas with AI",
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
      <body className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} antialiased`}>
        <SupabaseProvider>
          <header className="p-4 border-b">
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/baskets/create">Baskets</Link>
              <Link href="/blocks">Blocks</Link>
              <QueueLink />
            </nav>
          </header>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}

