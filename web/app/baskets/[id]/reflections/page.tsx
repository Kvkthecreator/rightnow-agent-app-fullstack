import { SubpageHeader } from "@/components/basket/SubpageHeader";
import { RequestBoundary } from "@/components/RequestBoundary";
import dynamic from 'next/dynamic';

const ReflectionsClient = dynamic(() => import('./ReflectionsClient'), {
  loading: () => (
    <div className="space-y-4">
      <div className="animate-pulse bg-gray-100 h-32 rounded-lg"></div>
      <div className="animate-pulse bg-gray-100 h-24 rounded-lg"></div>
    </div>
  ),
});

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReflectionsPage({ params }: PageProps) {
  const { id } = await params;
  
  return (
    <RequestBoundary>
      <div className="flex h-full flex-col">
        <div className="border-b p-4">
          <SubpageHeader 
            title="Reflections" 
            basketId={id}
            description="P3 Agent insights - patterns, tensions, and questions discovered from your memory"
          />
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="mx-auto max-w-4xl">
            {/* P3 Agent Overview Banner */}
            <div className="bg-white border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                    P3 Reflection Agent
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Computational insights discovering patterns, tensions, and questions from your substrate
                  </p>
                </div>
                <div className="text-xs text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                  🤔 Intelligent Analysis
                </div>
              </div>
            </div>

            <div className="p-6">
              <ReflectionsClient basketId={id} />
            </div>
          </div>
        </div>
      </div>
    </RequestBoundary>
  );
}
