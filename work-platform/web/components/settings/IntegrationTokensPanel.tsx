"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Copy, RefreshCw, Trash2, Plus } from "lucide-react";

interface IntegrationTokenRow {
  id: string;
  description?: string | null;
  created_at?: string | null;
  revoked_at?: string | null;
  last_used_at?: string | null;
}

export default function IntegrationTokensPanel() {
  const [tokens, setTokens] = useState<IntegrationTokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/integrations/tokens", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load tokens");
      }
      setTokens(data.tokens || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tokens");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTokens();
  }, [fetchTokens]);

  const handleCreate = useCallback(async () => {
    try {
      setCreating(true);
      setGeneratedToken(null);
      const res = await fetch("/api/integrations/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: newDescription || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to create token");
      }
      setGeneratedToken(data.token as string);
      setNewDescription("");
      await fetchTokens();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create token");
    } finally {
      setCreating(false);
    }
  }, [fetchTokens, newDescription]);

  const handleRevoke = useCallback(async (tokenId: string) => {
    if (!confirm("Revoke this integration token?")) return;
    await fetch(`/api/integrations/tokens/${tokenId}`, {
      method: "DELETE",
    });
    await fetchTokens();
  }, [fetchTokens]);

  const copyToken = useCallback(async () => {
    if (!generatedToken) return;
    await navigator.clipboard.writeText(generatedToken);
    alert("Token copied to clipboard. Store it securely—this is the only time it will be shown.");
  }, [generatedToken]);

  const activeTokens = useMemo(() => tokens.filter(t => !t.revoked_at), [tokens]);

  return (
    <div className="rounded-lg border bg-white">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold">Integration Tokens</h2>
          <p className="text-sm text-muted-foreground">
            Generate tokens for Claude/Cursor integrations. Revoke any token you no longer need.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void fetchTokens()} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Token description (optional)</label>
          <Input
            placeholder="e.g., Claude Desktop personal laptop"
            value={newDescription}
            onChange={(event) => setNewDescription(event.target.value)}
          />
          <Button onClick={() => void handleCreate()} disabled={creating}>
            <Plus className="h-4 w-4 mr-2" />
            {creating ? "Generating..." : "Generate token"}
          </Button>
        </div>

        {generatedToken && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            <p className="font-medium">New token (copy now – it won’t be shown again)</p>
            <div className="mt-2 flex items-center justify-between gap-3 rounded border border-blue-300 bg-white px-3 py-2">
              <code className="text-xs break-all">{generatedToken}</code>
              <Button variant="ghost" size="sm" onClick={() => void copyToken()}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Existing tokens</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading tokens…</p>
          ) : tokens.length === 0 ? (
            <p className="text-sm text-muted-foreground">No integration tokens yet.</p>
          ) : (
            <div className="space-y-3">
              {tokens.map((token) => {
                const revoked = Boolean(token.revoked_at);
                return (
                  <div
                    key={token.id}
                    className="rounded-md border px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs">{token.id}</code>
                        <Badge variant={revoked ? "secondary" : "default"}>
                          {revoked ? "Revoked" : "Active"}
                        </Badge>
                      </div>
                      {token.description && (
                        <p className="text-sm text-muted-foreground mt-1">{token.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-1">
                        {token.created_at && <span>Created: {new Date(token.created_at).toLocaleString()}</span>}
                        {token.last_used_at && <span>Last used: {new Date(token.last_used_at).toLocaleString()}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!revoked && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleRevoke(token.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
          Tip: Generate separate tokens per device or assistant. You can revoke tokens individually without
          affecting other connections.
        </div>
      </div>
    </div>
  );
}
