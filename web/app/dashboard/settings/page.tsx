import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Database } from "@/lib/dbTypes";

import SettingsSection from "@/components/settings/SettingsSection";
import DisplayBox from "@/components/settings/DisplayBox";
import { ArrowLeft, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";
import IntegrationTokensPanel from "@/components/settings/IntegrationTokensPanel";
import { formatDistanceToNow } from "date-fns";

export default async function SettingsPage() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/settings");
  }

  const displayName =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    "Unknown";

  const workspace = await ensureWorkspaceServer(supabase);
  const workspaceId = workspace?.id ?? null;

  const { data: integrationTokens } = await supabase
    .from('integration_tokens')
    .select('id, last_used_at, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(1);

  const { data: openaiToken } = await supabase
    .from('openai_app_tokens')
    .select('install_id, updated_at, expires_at')
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  const claudeConnected = Boolean(integrationTokens?.length);
  const chatgptConnected = Boolean(openaiToken);

  const claudeLastUsed = integrationTokens?.[0]?.last_used_at
    ? formatDistanceToNow(new Date(integrationTokens[0].last_used_at), { addSuffix: true })
    : 'Never';

  const chatgptLastUpdated = openaiToken?.updated_at
    ? formatDistanceToNow(new Date(openaiToken.updated_at), { addSuffix: true })
    : 'Awaiting launch';

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-6 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/home"
              className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <SettingsIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Account Settings</h1>
              <p className="text-gray-600 text-sm">Manage your account and workspace details</p>
            </div>
          </div>
        </div>
      </div>
      <SettingsSection
        title="Settings"
        description="Manage your account preferences and profile details"
      >
        <DisplayBox label="UID" value={user.id} />
        <DisplayBox label="Display Name" value={displayName} />
        <DisplayBox label="Email" value={user.email ?? "Unknown"} />

        {workspaceId ? (
          <DisplayBox label="Workspace ID" value={workspaceId} />
        ) : (
          <div className="rounded-md bg-red-50 p-4 text-red-800 border border-red-200">
            <strong>⚠️ Workspace creation failed</strong>
            <p className="mt-1 text-sm">
              We couldn’t create your workspace. Please try again later or contact support.
            </p>
          </div>
        )}
      </SettingsSection>

      <SettingsSection
        title="Integrations"
        description="Connect Claude and ChatGPT to Yarnnn’s ambient memory."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <IntegrationStatusCard
            host="Claude"
            description="Remote MCP connector for Claude and Claude Desktop"
            connected={claudeConnected}
            metaLabel="Last activity"
            metaValue={claudeLastUsed}
            docsHref="/docs/integrations/claude"
          />
          <IntegrationStatusCard
            host="ChatGPT"
            description="OpenAI Apps SDK connector (preview)"
            connected={chatgptConnected}
            metaLabel={chatgptConnected ? 'Linked' : 'Status'}
            metaValue={chatgptConnected ? chatgptLastUpdated : 'Waiting for public Apps SDK'}
            docsHref="/docs/integrations/chatgpt"
          />
        </div>
      </SettingsSection>

      <IntegrationTokensPanel />
    </div>
  );
}

function IntegrationStatusCard({
  host,
  description,
  connected,
  metaLabel,
  metaValue,
  docsHref,
}: {
  host: string;
  description: string;
  connected: boolean;
  metaLabel: string;
  metaValue: string;
  docsHref: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{host}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <span
          className={
            connected
              ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700'
              : 'rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700'
          }
        >
          {connected ? 'Connected' : 'Not connected'}
        </span>
      </div>
      <div className="text-xs text-muted-foreground">
        {metaLabel}: {metaValue}
      </div>
      <div className="flex gap-3 text-sm">
        <Link href={docsHref} className="text-primary hover:underline">
          View guide
        </Link>
        {host === 'Claude' && (
          <Link href="/memory/unassigned" className="text-muted-foreground hover:text-foreground">
            View unassigned queue
          </Link>
        )}
      </div>
    </div>
  );
}
