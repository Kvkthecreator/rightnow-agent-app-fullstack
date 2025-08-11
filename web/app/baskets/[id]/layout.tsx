import { BasketProvider as BasketIdProvider } from "@/lib/context/BasketContext";
import { BasketProvider } from "@/contexts/BasketContext";
import {
  getBasketData,
  getBasketDocuments,
  getUserAndWorkspace,
} from "@/lib/data/basketData";
import { redirect, notFound } from "next/navigation";

interface BasketLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function BasketLayout({ children, params }: BasketLayoutProps) {
  const { id } = await params;

  try {
    const { user, workspace } = await getUserAndWorkspace();

    if (!user) {
      redirect(`/login?redirect=/baskets/${id}/work`);
    }

    if (!workspace?.id) {
      redirect("/dashboard/home");
    }

    const [basketData, documents] = await Promise.all([
      getBasketData(id),
      getBasketDocuments(id),
    ]);

    if (!basketData) {
      notFound();
    }

    const basketForContext = {
      id: basketData.id,
      name: basketData.name,
      status: basketData.status,
      created_at: basketData.createdAt,
      updated_at: basketData.createdAt,
      description: undefined,
    };

    return (
      <BasketIdProvider initialBasketId={id}>
        <BasketProvider initialBasket={basketForContext} initialDocuments={documents}>
          {children}
        </BasketProvider>
      </BasketIdProvider>
    );
  } catch (error) {
    console.error("Error loading basket layout:", error);
    notFound();
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const basketData = await getBasketData(id);

  return {
    title: `${basketData?.name || "Basket"} - Yarnnn`,
    description: "Strategic intelligence project",
  };
}

