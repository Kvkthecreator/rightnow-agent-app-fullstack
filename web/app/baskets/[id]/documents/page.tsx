import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import { checkBasketAccess } from "@/lib/baskets/access";
import DocsList from "@/components/basket/DocsList";
import { getServerUrl } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentsPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServerComponentClient({ cookies });
  
  // SECURITY: Add missing authorization check - was completely unprotected!
  const { basket } = await checkBasketAccess(supabase, id);
  
  const baseUrl = getServerUrl();
  const res = await fetch(`${baseUrl}/api/baskets/${id}/documents`, { 
    cache: "no-store",
    headers: {
      // Forward auth cookies to API
      "Cookie": cookies().toString()
    }
  });
  const docs = await res.json();
  return <DocsList items={docs.items || []} />;
}
