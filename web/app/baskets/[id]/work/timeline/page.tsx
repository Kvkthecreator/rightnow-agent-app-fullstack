import { getBasketData } from "@/lib/data/basketData";
import { notFound } from "next/navigation";
import { Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface TimelinePageProps {
  params: Promise<{ id: string }>;
}

export default async function TimelinePage({ params }: TimelinePageProps) {
  const { id } = await params;
  const basketData = await getBasketData(id);
  
  if (!basketData) {
    notFound();
  }

  return (
    <div className="timeline-view p-6 h-full flex items-center justify-center">
      <div className="text-center max-w-md">
        <Clock className="h-16 w-16 text-gray-300 mx-auto mb-6" />
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Timeline View</h1>
        <p className="text-gray-600 mb-2">
          Project timeline and evolution tracking for <strong>{basketData.name}</strong>
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Coming in Phase 2 - Watch your project evolve through our collaboration
        </p>
        <Link href={`/baskets/${id}/work`}>
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}