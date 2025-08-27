"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OnboardingGate({ basketId: _basketId }: { basketId: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace("/welcome");
  }, [router]);

  return null;
}
