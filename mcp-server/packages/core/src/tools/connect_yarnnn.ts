import { z } from 'zod';
import type { YARNNNClient } from '../client.js';
import type { ConnectYarnnnResponse } from '../types/index.js';

export const connectYarnnnSchema = z.object({
  workspace_hint: z.string().uuid().optional().describe('Optional workspace UUID to validate against.'),
});

export type ConnectYarnnnInput = z.infer<typeof connectYarnnnSchema>;

export async function connectYarnnn(
  _input: ConnectYarnnnInput,
  client: YARNNNClient
): Promise<ConnectYarnnnResponse> {
  try {
    const status = await client.get<{ linked?: boolean; install_id?: string; expires_at?: string; scope?: string }>(
      '/api/integrations/openai/tokens/me'
    );

    if (status?.linked) {
      return {
        status: 'linked',
        linked: true,
        install_id: status.install_id ?? null,
        expires_at: status.expires_at ?? null,
        scope: status.scope ?? null,
      };
    }

    return {
      status: 'not_linked',
      linked: false,
    };
  } catch (error) {
    return {
      status: 'error',
      linked: false,
      error: error instanceof Error ? error.message : 'Failed to verify Yarnnn connection',
    };
  }
}

export const connectYarnnnTool = {
  name: 'connect_yarnnn',
  description: `Verify that the current ChatGPT app install is linked to a Yarnnn workspace.

Use this tool to confirm that OAuth credentials are present and healthy. Returns connection metadata (install id, expiry).`,
  inputSchema: connectYarnnnSchema,
};
