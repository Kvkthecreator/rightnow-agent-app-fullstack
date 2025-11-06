import { redirect } from 'next/navigation';

/**
 * Project root page - redirects to overview
 * Default view when navigating to /projects/[id]
 */
export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/projects/${id}/overview`);
}
