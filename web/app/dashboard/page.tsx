import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/dbTypes';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { listBasketsByWorkspace } from '@/lib/baskets/listBasketsByWorkspace';
import { cn } from '@/lib/utils';

function formatTimestamp(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '—';
  return date.toLocaleString();
}

export default async function DashboardPage() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { userId } = await getAuthenticatedUser(supabase);
  const workspace = await ensureWorkspaceForUser(userId, supabase);

  const { data: baskets } = await listBasketsByWorkspace(workspace.id);

  const { data: integrationTokens } = await supabase
    .from('integration_tokens')
    .select('id, created_at, last_used_at')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(1);

  const { data: openaiToken } = await supabase
    .from('openai_app_tokens')
    .select('install_id, expires_at, updated_at')
    .eq('workspace_id', workspace.id)
    .maybeSingle();

  const claudeConnected = Boolean(integrationTokens?.length);
  const chatgptConnected = Boolean(openaiToken);

  const { count: unassignedCount } = await supabase
    .from('mcp_unassigned_captures')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspace.id)
    .eq('status', 'pending');

  const {
    data: pendingProposals,
    count: pendingProposalCount,
  } = await supabase
    .from('proposals')
    .select('id, basket_id, proposal_kind, origin, metadata, created_at', { count: 'exact' })
    .eq('workspace_id', workspace.id)
    .eq('status', 'PROPOSED')
    .order('created_at', { ascending: false })
    .limit(5);

  const basketName = new Map(baskets?.map((basket) => [basket.id, basket.name || 'Untitled basket']));

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold">Control Tower</h1>
        <p className="text-sm text-muted-foreground">
          Monitor ambient activity, triage captures, and keep integrations healthy.
        </p>
      </header>

      {!claudeConnected && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          Claude isn&apos;t connected yet. Generate an integration token and add Yarnnn as a remote MCP connector inside Claude.
          <Link href="/dashboard/settings" className="ml-2 underline">
            Open integrations settings
          </Link>
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">Integrations</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <StatusCard
            title="Claude"
            description="Remote MCP connector for Claude and Claude Desktop."
            status={claudeConnected ? 'Connected' : 'Not linked'}
            meta={formatTimestamp(integrationTokens?.[0]?.last_used_at)}
            actionLabel={claudeConnected ? 'Manage tokens' : 'Connect Claude'}
            actionHref="/dashboard/settings"
            docsHref="/docs/integrations/claude"
          />
          <StatusCard
            title="ChatGPT"
            description="OpenAI Apps SDK integration (preview)."
            status={chatgptConnected ? 'Connected' : 'Waiting'}
            meta={chatgptConnected ? formatTimestamp(openaiToken?.updated_at) : 'Join the waitlist'}
            actionLabel={chatgptConnected ? 'View connection' : 'Preview details'}
            actionHref="/dashboard/settings"
            docsHref="/docs/integrations/chatgpt"
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">Queues</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <QueueCard
            title="Unassigned captures"
            description="Low-confidence writes waiting for review."
            count={unassignedCount ?? 0}
            href="/memory/unassigned"
            cta="Open queue"
          />
          <QueueCard
            title="Pending proposals"
            description="Substrate changes awaiting approval."
            count={pendingProposalCount ?? 0}
            href="/governance/settings"
            cta="Review governance"
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground">Recent governance activity</h2>
          <Link href="/governance/settings" className="text-sm text-muted-foreground hover:text-foreground">
            Open governance
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {pendingProposals && pendingProposals.length > 0 ? (
            pendingProposals.map((proposal: any) => {
              const hostLabel = proposal.source_host || proposal.metadata?.source_host || (proposal.origin === 'agent' ? 'ambient' : 'human');
              return (
                <div
                  key={proposal.id}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {formatProposalKind(proposal.proposal_kind)} · {basketName.get(proposal.basket_id) || 'Unknown basket'}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{formatTimestamp(proposal.created_at)}</span>
                      <span>·</span>
                      <span>{hostLabel}</span>
                    </span>
                  </div>
                  <Link
                    href={`/baskets/${proposal.basket_id}/governance`}
                    className="text-primary hover:underline"
                  >
                    Review
                  </Link>
                </div>
              );
            })
          ) : (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No pending governance proposals.
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground">Active baskets</h2>
          <Link href="/baskets" className="text-sm text-muted-foreground hover:text-foreground">
            View all
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {baskets && baskets.length > 0 ? (
            baskets.slice(0, 5).map((basket) => (
              <Link
                key={basket.id}
                href={`/baskets/${basket.id}/memory`}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm transition hover:border-primary"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{basket.name || 'Untitled basket'}</span>
                  <span className="text-muted-foreground">Created {formatTimestamp(basket.created_at)}</span>
                </div>
                <span className="text-muted-foreground">Mode: {basket.mode}</span>
              </Link>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No baskets yet. Ambient captures will appear here once your AI hosts are connected.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function StatusCard({
  title,
  description,
  status,
  meta,
  actionLabel,
  actionHref,
  docsHref,
}: {
  title: string;
  description: string;
  status: string;
  meta: string;
  actionLabel: string;
  actionHref: string;
  docsHref: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <span className={cn('rounded-full px-3 py-1 text-xs font-medium tracking-wide', statusBadgeClass(status))}>
          {status}
        </span>
      </div>
      <div className="text-xs text-muted-foreground">Last activity: {meta}</div>
      <div className="flex items-center gap-3 text-sm">
        <Link href={actionHref} className="text-primary hover:underline">
          {actionLabel}
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link href={docsHref} className="text-muted-foreground hover:text-foreground">
          Docs
        </Link>
      </div>
    </div>
  );
}

function QueueCard({
  title,
  description,
  count,
  href,
  cta,
}: {
  title: string;
  description: string;
  count: number;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-border p-4">
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-2xl font-semibold">{count}</span>
        <Link href={href} className="text-primary hover:underline">
          {cta}
        </Link>
      </div>
    </div>
  );
}

function statusBadgeClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes('not') || normalized.includes('waiting')) {
    return 'bg-amber-100 text-amber-700';
  }
  if (normalized.includes('connected') || normalized.includes('linked')) {
    return 'bg-emerald-100 text-emerald-700';
  }
  return 'bg-muted text-foreground';
}

function formatProposalKind(kind: string) {
  return kind
    .toLowerCase()
    .split('_')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}
