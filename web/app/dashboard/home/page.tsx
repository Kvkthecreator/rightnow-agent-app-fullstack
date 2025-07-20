import { getOrCreateWorkspace } from "@/lib/workspaces";
import AuthGuard from "@/components/AuthGuard";

export default async function HomePage() {
  await getOrCreateWorkspace();
  return (
    <AuthGuard>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-2">👋 Welcome back</h1>
        <p className="text-muted-foreground">
          Use the sidebar to select or create a basket to get started.
        </p>
      </div>
    </AuthGuard>
  );
}
