"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSessionContext } from "@supabase/auth-helpers-react";
import Shell from "@/components/layouts/Shell";


export default function Layout({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useSessionContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && session) {
      const contextBlocks = (session.user.user_metadata as any)?.context_blocks;
      if (!contextBlocks || contextBlocks.length === 0) {
        if (pathname !== "/blocks/setup") {
          router.replace("/blocks/setup");
        }
      }
    }
  }, [session, isLoading, pathname, router]);

  if (isLoading) {
    return null;
  }

  return <Shell>{children}</Shell>;
}

