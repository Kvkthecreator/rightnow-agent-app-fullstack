'use client';

/**
 * MCP OAuth Authorization Page
 *
 * This page handles the OAuth authorization flow for Claude.ai remote MCP connector.
 * Users are redirected here from the MCP server's /authorize endpoint.
 *
 * Flow:
 * 1. User clicks "Connect YARNNN" in Claude.ai
 * 2. Claude redirects to MCP server /authorize
 * 3. MCP server redirects here with state/redirect_uri params
 * 4. User sees this page and clicks "Authorize"
 * 5. This page ensures user is authenticated via Supabase
 * 6. Redirects back to MCP server /oauth/callback with Supabase token
 * 7. MCP server generates OAuth code and redirects back to Claude
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function MCPAuthorizePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  const mcpCallback = searchParams.get('mcp_callback');

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      console.log('[MCP Auth] Checking authentication...');
      const { data, error } = await supabase.auth.getUser();
      console.log('[MCP Auth] Auth check result:', {
        hasUser: !!data?.user,
        error: error?.message,
        userId: data?.user?.id
      });

      if (error || !data?.user) {
        // Not authenticated - redirect to login with return URL
        const returnUrl = `/mcp/authorize?${searchParams.toString()}`;
        console.log('[MCP Auth] Not authenticated, redirecting to login with returnUrl:', returnUrl);
        router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
        return;
      }

      console.log('[MCP Auth] User authenticated:', data.user.email);
      setUser(data.user);
      setLoading(false);
    } catch (err) {
      console.error('[MCP Auth] Auth check failed:', err);
      setError('Failed to check authentication status');
      setLoading(false);
    }
  }

  async function handleAuthorize() {
    if (!redirectUri || !state || !mcpCallback) {
      setError('Missing required parameters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Get fresh session token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setError('No active session found');
        return;
      }

      // Get workspace ID (assumes user has exactly one workspace per YARNNN canon)
      const { data: workspace } = await supabase
        .from('workspace_memberships')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single();

      if (!workspace) {
        setError('No workspace found');
        return;
      }

      // Redirect back to MCP server callback with auth info
      const callbackUrl = new URL(mcpCallback);
      callbackUrl.searchParams.set('token', token);
      callbackUrl.searchParams.set('user_id', user.id);
      callbackUrl.searchParams.set('workspace_id', workspace.workspace_id);
      callbackUrl.searchParams.set('redirect_uri', redirectUri);
      callbackUrl.searchParams.set('state', state);

      window.location.href = callbackUrl.toString();
    } catch (err) {
      console.error('Authorization failed:', err);
      setError('Failed to authorize. Please try again.');
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🧶</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Authorization Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/baskets')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Return to YARNNN
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🧶</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect YARNNN to Claude</h1>
          <p className="text-gray-600">
            Claude.ai is requesting access to your YARNNN workspace
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900 font-medium mb-2">This will allow Claude to:</p>
          <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
            <li>Capture thoughts and notes to your workspace</li>
            <li>Retrieve substrate memory from your baskets</li>
            <li>Add context to existing baskets</li>
            <li>Validate substrate structure</li>
          </ul>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Logged in as:</span> {user?.email}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/baskets')}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAuthorize}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Authorizing...' : 'Authorize'}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          You can revoke this access at any time from your YARNNN settings
        </p>
      </div>
    </div>
  );
}
