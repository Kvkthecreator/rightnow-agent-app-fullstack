"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OrphanWorkRedirect() {
  const router = useRouter();

  useEffect(() => {
    console.warn("🚨 Invalid /work route accessed. Redirecting to /home.");
    router.replace("/home");
  }, []);

  return <p className="p-4 text-muted-foreground">Redirecting...</p>;
}
