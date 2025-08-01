import BasketWorkLayout from "@/components/basket/BasketWorkLayout";
import { getBasketData, getBasketDocuments, getUserAndWorkspace } from "@/lib/data/basketData";
import { redirect, notFound } from "next/navigation";

interface BasketWorkLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function WorkLayout({ children, params }: BasketWorkLayoutProps) {
  const { id } = await params;
  
  try {
    // Check authentication and workspace
    const { user, workspace } = await getUserAndWorkspace();
    
    if (!user) {
      console.warn("❌ No user found. Redirecting to login.");
      redirect(`/login?redirect=/baskets/${id}/work`);
    }

    if (!workspace?.id) {
      console.warn("❌ No workspace found. Redirecting to home.");
      redirect("/dashboard/home");
    }

    // Fetch basket data and documents in parallel
    const [basketData, documents] = await Promise.all([
      getBasketData(id),
      getBasketDocuments(id)
    ]);

    if (!basketData) {
      console.warn("❌ Basket not found", { basketId: id, workspaceId: workspace.id });
      notFound();
    }

    console.log("✅ Basket work layout loaded:", {
      basketId: id,
      basketName: basketData.name,
      documentsCount: documents.length
    });

    return (
      <BasketWorkLayout
        basketId={id}
        basketName={basketData.name}
        documents={documents}
      >
        {children}
      </BasketWorkLayout>
    );
  } catch (error) {
    console.error('Error loading basket work layout:', error);
    notFound();
  }
}

// Optional: Add metadata
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const basketData = await getBasketData(id);
  
  return {
    title: `${basketData?.name || 'Basket'} - Yarnnn`,
    description: 'Strategic intelligence workspace'
  };
}