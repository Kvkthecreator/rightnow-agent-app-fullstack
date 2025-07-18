import type { Metadata } from "next";
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import "./globals.css";
import "../styles/diff.css";
import SupabaseProvider from "@/components/SupabaseProvider";
import { Toaster } from "react-hot-toast";
import DumpModalWrapper from "@/components/DumpModalWrapper";
import { BasketProvider } from "@/lib/context/BasketContext";
import Sidebar from "@/app/components/shell/Sidebar";
import TopBar from "@/components/common/TopBar";

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
      <body className="antialiased min-h-screen flex">
        <BasketProvider>
          <SupabaseProvider>
            <Sidebar />
            <div className="flex flex-col flex-1">
              <TopBar />
              <main>{children}</main>
            </div>
          </SupabaseProvider>
          <DumpModalWrapper />
        </BasketProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
