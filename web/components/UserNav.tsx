"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/clients";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { User as UserIcon } from "lucide-react";
import { dlog } from "@/lib/dev/log";
import { clearSessionCache } from "@/lib/api/http";

interface User {
  email: string;
}

interface UserNavProps {
  /** Hide user email, show only icon (for compact sidebar) */
  compact?: boolean;
}

const supabase = createBrowserClient();

export default function UserNav({ compact = false }: UserNavProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  // StrictMode guards
  const hasInitialized = useRef(false);
  const hasSubscribed = useRef(false);

  // Fetch initial user and redirect if not authenticated
  useEffect(() => {
    if (hasInitialized.current) {
      dlog('auth/user-nav-skip-init', { reason: 'already-initialized' });
      return;
    }

    hasInitialized.current = true;

    dlog('auth/user-nav-init', { timestamp: Date.now() });

    supabase.auth.getUser().then(({ data: { user } }) => {
      dlog('auth/user-nav-result', { hasUser: !!user, userId: user?.id });

      if (user) {
        setUser({ email: user.email || "" });
      } else {
        router.replace("/about");
      }
    });
  }, [router]);

  // Subscribe to auth state changes for auto-refresh and logout
  useEffect(() => {
    if (hasSubscribed.current) {
      dlog('auth/user-nav-skip-subscribe', { reason: 'already-subscribed' });
      return;
    }
    
    hasSubscribed.current = true;
    
    dlog('auth/user-nav-subscribe', { timestamp: Date.now() });
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      dlog('auth/user-nav-change', { event });

      // Clear session cache on any auth state change
      clearSessionCache();

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUser({ email: user.email || "" });
      } else {
        setUser(null);
        router.replace("/about");
      }
    });
    
    return () => {
      dlog('auth/user-nav-unsubscribe', { timestamp: Date.now() });
      subscription.unsubscribe();
    };
  }, [router]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    // Clear session cache before signing out
    clearSessionCache();
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    }
    router.replace("/about");
  };

  if (!user) {
    return null;
  }

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        onClick={() => setIsOpen((prev) => !prev)}
        className={compact ? "flex justify-center p-2" : "flex items-center space-x-2"}
      >
        <UserIcon className="h-5 w-5" />
        {!compact && <span className="text-sm font-medium">{user.email}</span>}
      </Button>
      {isOpen && (
        <Card className="absolute right-0 mt-2 w-48 p-2">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start"
          >
            Logout
          </Button>
        </Card>
      )}
    </div>
  );
}