import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/dbTypes';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { listBasketsByWorkspace } from '@/lib/baskets/listBasketsByWorkspace';
import { cn } from '@/lib/utils';
import { apiGet } from '@/lib/server/http';
import AlertAnnouncer, { type DashboardAlert as AnnouncerAlert } from '@/components/dashboard/AlertAnnouncer';

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

  const { data: hostSummaries } = await supabase
    .from('mcp_activity_host_recent')
    .select('host, last_seen_at, calls_last_hour, errors_last_hour, p95_latency_ms')
    .eq('workspace_id', workspace.id);

  const { data: recentActivity } = await supabase
    .from('mcp_activity_logs')
    .select('id, host, tool, result, latency_ms, error_code, fingerprint_summary, created_at')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(8);

  // Fetch alerts directly from Supabase (server-side)
  let alerts: AnnouncerAlert[] = [];
  try {
    const { data: alertsData } = await supabase
      .from('user_alerts')
      .select('*')
      .eq('user_id', userId)
      .is('dismissed_at', null)
      .order('created_at', { ascending: false })
      .limit(10);

    alerts = (alertsData || []).map((alert) => ({
      id: alert.id,
      type: alert.alert_type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      created_at: alert.created_at,
    }));
  } catch (error) {
    console.error('[Dashboard] Failed to load alerts', error);
  }

  const claudeSummary = hostSummaries?.find((row) => row.host === 'claude');
  const chatgptSummary = hostSummaries?.find((row) => row.host === 'chatgpt');

const claudeStatus = deriveHostStatus(claudeConnected, claudeSummary);
const chatgptStatus = deriveHostStatus(chatgptConnected, chatgptSummary);

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

      {alerts.length > 0 && (
        <section className="space-y-2">
          <AlertAnnouncer alerts={alerts} />
          {alerts.map((alert) => (
            <AlertBanner key={alert.id} alert={alert} />
          ))}
        </section>
      )}

      {(!claudeConnected || !chatgptConnected) && (
        <GettingStartedCard claudeConnected={claudeConnected} chatgptConnected={chatgptConnected} />
      )}

      <section>
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">Integrations</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <StatusCard
            title="Claude"
            description="Remote MCP connector for Claude and Claude Desktop."
            status={claudeStatus.badge}
            meta={claudeStatus.meta}
            actionLabel={claudeConnected ? 'Manage tokens' : 'Connect Claude'}
            actionHref="/dashboard/settings"
            docsHref="/docs/integrations/claude"
          />
          <StatusCard
            title="ChatGPT"
            description="OpenAI Apps SDK integration (preview)."
            status={chatgptStatus.badge}
            meta={chatgptStatus.meta}
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
                <span className="text-muted-foreground">{basket.status ?? 'Active'}</span>
             </Link>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No baskets yet. Ambient captures will appear here once your AI hosts are connected.
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground">MCP activity</h2>
          <Link href="/dashboard/settings" className="text-sm text-muted-foreground hover:text-foreground">
            Manage integrations
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {recentActivity && recentActivity.length > 0 ? (
            recentActivity.map((event) => (
              <div
                key={event.id}
                className={cn(
                  'flex items-start justify-between rounded-lg border px-4 py-3 text-sm',
                  event.result === 'error' ? 'border-rose-200 bg-rose-50' : 'border-border'
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{event.host}</span>
                    <span className={cn('rounded-full px-2 py-0.5 text-xs', statusBadgeClass(event.result))}>
                      {event.result}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">{event.tool}</span>
                    <span className="mx-1">·</span>
                    <span>{formatTimestamp(event.created_at)}</span>
                    {event.latency_ms ? (
                      <>
                        <span className="mx-1">·</span>
                        <span>{event.latency_ms}ms</span>
                      </>
                    ) : null}
                  </div>
                  {event.fingerprint_summary ? (
                    <p className="text-xs text-muted-foreground line-clamp-2">{event.fingerprint_summary}</p>
                  ) : null}
                  {event.error_code ? (
                    <p className="text-xs text-rose-700">Error code: {event.error_code}</p>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No recent MCP calls yet. Once Claude or ChatGPT run tools, activity will appear here.
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
      <div className="text-xs text-muted-foreground">{meta}</div>
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

function AlertBanner({ alert }: { alert: AnnouncerAlert }) {
  const severityClass = alert.severity === 'error'
    ? 'border-rose-200 bg-rose-50 text-rose-900'
    : 'border-amber-200 bg-amber-50 text-amber-900';

  return (
    <div className={cn('flex flex-col gap-2 rounded-lg border px-4 py-3 text-sm', severityClass)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">{alert.title}</h3>
          <p className="text-sm">{alert.message}</p>
        </div>
        {alert.action_href ? (
          <Link
            href={alert.action_href}
            className="shrink-0 rounded-md border border-current px-3 py-1 text-xs font-medium hover:bg-white/20"
          >
            {alert.action_label || 'Review'}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function GettingStartedCard({
  claudeConnected,
  chatgptConnected,
}: {
  claudeConnected: boolean;
  chatgptConnected: boolean;
}) {
  return (
    <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 text-sm text-indigo-900">
      <h2 className="text-base font-semibold text-indigo-900">Getting started</h2>
      <p className="mt-2 max-w-3xl">
        Connect Yarnnn to your AI hosts so ambient captures land in governed baskets. Start with Claude, then stay ready for the ChatGPT preview.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5">
        <li>
          <Link href="/dashboard/settings" className="underline">
            Generate an integration token
          </Link>{' '}
          for your workspace.
        </li>
        <li>
          Add <span className="font-medium">https://mcp.yarnnn.com</span> as a remote MCP connector inside Claude using that token.
        </li>
        <li>
          Triage low-confidence captures from the{' '}
          <Link href="/memory/unassigned" className="underline">
            Unassigned queue
          </Link>{' '}
          as they appear.
        </li>
        {!chatgptConnected && (
          <li>
            Review the{' '}
            <Link href="/docs/integrations/chatgpt" className="underline">
              ChatGPT Apps preview guide
            </Link>{' '}
            so you can link ChatGPT when the beta opens.
          </li>
        )}
      </ol>
      {!claudeConnected && (
        <p className="mt-4 text-xs text-indigo-800">
          Once Claude is connected this card will disappear. You can revisit the setup steps anytime from Integrations settings.
        </p>
      )}
    </section>
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
  if (normalized.includes('error')) {
    return 'bg-rose-100 text-rose-700';
  }
  if (normalized.includes('success') || normalized.includes('healthy') || normalized.includes('connected') || normalized.includes('linked')) {
    return 'bg-emerald-100 text-emerald-700';
  }
  if (normalized.includes('warning')) {
    return 'bg-amber-100 text-amber-700';
  }
  if (normalized.includes('dormant') || normalized.includes('waiting') || normalized.includes('pending')) {
    return 'bg-amber-100 text-amber-700';
  }
  if (normalized.includes('queued')) {
    return 'bg-amber-100 text-amber-700';
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

function deriveHostStatus(
  connected: boolean,
  summary?: {
    last_seen_at: string | null;
    calls_last_hour: number | null;
    errors_last_hour: number | null;
    p95_latency_ms: number | null;
  }
) {
  const STALE_MINUTES = 60;
  const ERROR_THRESHOLD = 2;
  const P95_THRESHOLD = 800;

  if (!connected) {
    return {
      badge: 'Not linked',
      meta: 'Waiting for first connection',
    };
  }

  if (!summary) {
    return {
      badge: 'Pending activity',
      meta: 'No MCP traffic yet',
    };
  }

  const calls = summary.calls_last_hour ?? 0;
  const errors = summary.errors_last_hour ?? 0;
  const lastSeen = summary.last_seen_at ? formatTimestamp(summary.last_seen_at) : 'Never';
  const minutesSinceLastSeen = summary.last_seen_at
    ? Math.floor((Date.now() - new Date(summary.last_seen_at).getTime()) / 60000)
    : Number.POSITIVE_INFINITY;
  const p95Value = summary.p95_latency_ms ?? null;
  const p95 = summary.p95_latency_ms ? `${Math.round(summary.p95_latency_ms)}ms p95` : 'Latency pending';

  if (errors >= ERROR_THRESHOLD) {
    return {
      badge: 'Errors detected',
      meta: `${errors} errors in last hour · Last call ${lastSeen}`,
    };
  }

  if (calls === 0 || minutesSinceLastSeen > STALE_MINUTES) {
    return {
      badge: 'Dormant',
      meta: `No calls in last hour · Last call ${lastSeen}`,
    };
  }

  if (p95Value && p95Value > P95_THRESHOLD) {
    return {
      badge: 'Warning: slow',
      meta: `${calls} calls in last hour · ${p95}`,
    };
  }

  return {
    badge: 'Healthy',
    meta: `${calls} calls in last hour · ${p95}`,
  };
}
