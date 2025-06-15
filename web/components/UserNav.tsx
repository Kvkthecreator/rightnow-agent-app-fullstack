"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { User as UserIcon } from "lucide-react";

interface User {
  email: string;
}

interface UserNavProps {
  /** Hide user email, show only icon (for compact sidebar) */
  compact?: boolean;
}

export default function UserNav({ compact = false }: UserNavProps) {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fetch initial session and redirect if not authenticated
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ email: session.user.email || "" });
      } else {
        router.replace("/about");
      }
    });
  }, [supabase, router]);

  // Subscribe to auth state changes for auto-refresh and logout
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({ email: session.user.email || "" });
      } else {
        setUser(null);
        router.replace("/about");
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

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