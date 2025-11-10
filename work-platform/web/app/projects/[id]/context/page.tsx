/**
 * Page: /projects/[id]/context - Project Context Blocks
 *
 * Displays substrate blocks (knowledge & meaning) available for this project.
 * Shows what context agents can query when executing work.
 *
 * Architecture:
 * - Work-platform READS context from substrate-api (via BFF)
 * - Edit requests are DELEGATED to substrate-api (not performed locally)
 * - This validates substrate integration for agent execution
 */

import { cookies } from "next/headers";
import { createServerComponentClient } from "@/lib/supabase/clients";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Database, Brain } from "lucide-react";
import ContextBlocksClient from "./ContextBlocksClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectContextPage({ params }: PageProps) {
  const { id: projectId } = await params;

  const supabase = createServerComponentClient({ cookies });
  const { userId } = await getAuthenticatedUser(supabase);

  // Fetch project details
  let project: any = null;
  let error: string | null = null;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/projects/${projectId}`,
      {
        headers: {
          Cookie: (await cookies()).toString(),
        },
        cache: 'no-store',
      }
    );

    if (response.ok) {
      project = await response.json();
    } else if (response.status === 404) {
      error = 'Project not found';
    } else {
      error = 'Failed to load project';
    }
  } catch (err) {
    console.error('[Project Context] Error:', err);
    error = 'Failed to load project';
  }

  if (error || !project) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900">{error || 'Not Found'}</h2>
          <p className="mt-2 text-sm text-slate-600">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link href="/projects" className="mt-4 inline-block">
            <Button variant="outline">Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Project
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Context</h1>
            <p className="text-slate-600 mt-1">{project.name}</p>
            <p className="text-sm text-slate-500 mt-2">
              Substrate blocks available for agent work. Agents query this context to produce better results.
            </p>
          </div>
        </div>
      </div>

      {/* Context Blocks Client Component */}
      <ContextBlocksClient projectId={projectId} basketId={project.basket_id} />

      {/* Info Card */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <Brain className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900">
              How Agents Use Context
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              When executing work, agents query these blocks to understand your project's knowledge and meaning.
              Richer context leads to higher quality work outputs. Context is the foundation of agent intelligence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
