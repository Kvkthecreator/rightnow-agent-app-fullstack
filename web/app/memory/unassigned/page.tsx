import Link from 'next/link';

export default function UnassignedQueuePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Unassigned Captures</h1>
        <p className="text-sm text-muted-foreground">
          Low-confidence captures from MCP integrations will land here so you can
          route them to the correct basket. This queue will light up once basket
          inference is enabled for your workspace.
        </p>
      </header>

      <section className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        <p>No unassigned captures yet.</p>
        <p className="mt-1">
          Continue working inside Claude or ChatGPT. When YARNNN is uncertain
          about where to store a capture, you&apos;ll be asked to confirm the target
          basket and the item will appear here until it&apos;s resolved.
        </p>
      </section>

      <footer className="text-sm text-muted-foreground">
        Need to adjust basket anchors or governance?{' '}
        <Link href="/settings/integrations" className="underline">
          Manage integrations
        </Link>
        .
      </footer>
    </div>
  );
}
