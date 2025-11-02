"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Copy, RefreshCw, Trash2 } from "lucide-react";

interface IntegrationTokenRow {
  id: string;
  created_at?: string | null;
  revoked_at?: string | null;
  last_used_at?: string | null;
}

export default function ClaudeTokenManager() {
  const [tokens, setTokens] = useState<IntegrationTokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);

  const loadTokens = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/integrations/tokens", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load tokens");
      setTokens(data.tokens || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tokens");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTokens();
  }, [loadTokens]);

  const handleGenerate = useCallback(async () => {
    try {
      setGenerating(true);
      setNewToken(null);
      const res = await fetch("/api/integrations/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create token");
      setNewToken(data.token as string);
      await loadTokens();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create token");
    } finally {
      setGenerating(false);
    }
  }, [loadTokens]);

  const handleCopy = useCallback(async () => {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
  }, [newToken]);

  const handleRevoke = useCallback(async (id: string) => {
    if (!confirm("Revoke this token?")) return;
    await fetch(`/api/integrations/tokens/${id}`, { method: "DELETE" });
    await loadTokens();
  }, [loadTokens]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold">Claude integration token</h3>
            <p className="text-sm text-muted-foreground">
              Generate a fresh token and paste it into Claude&apos;s MCP settings. Tokens are shown once—copy right away.
            </p>
          </div>
          <Button variant="default" onClick={() => void handleGenerate()} disabled={generating}>
            {generating ? "Generating…" : "Generate token"}
          </Button>
        </div>

        {newToken && (
          <div className="mt-4 space-y-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-3 text-sm text-blue-800">
            <div className="font-medium">Copy this token now</div>
            <div className="flex items-center justify-between gap-2 rounded border border-blue-300 bg-white px-3 py-2">
              <code className="text-xs break-all">{newToken}</code>
              <Button variant="ghost" size="sm" onClick={() => void handleCopy()}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-muted-foreground">Existing tokens</span>
        <Button variant="ghost" size="sm" onClick={() => void loadTokens()} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading tokens…</p>
      ) : tokens.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tokens yet. Generate one to connect Claude.</p>
      ) : (
        <div className="space-y-3">
          {tokens.map((token) => {
            const revoked = Boolean(token.revoked_at);
            return (
              <div key={token.id} className="flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="text-xs text-muted-foreground">{token.id}</code>
                  <span
                    className={
                      revoked
                        ? 'rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'
                        : 'rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700'
                    }
                  >
                    {revoked ? 'Revoked' : 'Active'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  {token.created_at && <span>Created {new Date(token.created_at).toLocaleString()}</span>}
                  {token.last_used_at && <span>Last used {new Date(token.last_used_at).toLocaleString()}</span>}
                </div>
                {!revoked && (
                  <div className="mt-2">
                    <Button variant="ghost" size="sm" onClick={() => void handleRevoke(token.id)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Revoke
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
