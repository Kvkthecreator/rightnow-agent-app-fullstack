import * as dotenv from 'dotenv';

dotenv.config();

export interface Config {
  backendUrl: string;
  nodeEnv: 'development' | 'production' | 'test';
  mcpTransport: 'stdio' | 'http';
  port: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  sharedSecret?: string;
}

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string): string | undefined {
  return process.env[key] || undefined;
}

export const config: Config = {
  backendUrl: getEnv('BACKEND_URL', 'http://localhost:10000'),
  nodeEnv: (getEnv('NODE_ENV', 'development') as Config['nodeEnv']),
  mcpTransport: (getEnv('MCP_TRANSPORT', 'stdio') as Config['mcpTransport']),
  port: parseInt(getEnv('PORT', '3000'), 10),
  logLevel: (getEnv('LOG_LEVEL', 'info') as Config['logLevel']),
  sharedSecret: getOptionalEnv('MCP_SHARED_SECRET'),
};

export function validateConfig(): void {
  if (!['stdio', 'http'].includes(config.mcpTransport)) {
    throw new Error(`Invalid MCP_TRANSPORT: ${config.mcpTransport}. Must be 'stdio' or 'http'`);
  }

  if (config.mcpTransport === 'http' && !config.port) {
    throw new Error('PORT is required when MCP_TRANSPORT=http');
  }

  console.log(`[CONFIG] Loaded configuration:`, {
    backendUrl: config.backendUrl,
    nodeEnv: config.nodeEnv,
    mcpTransport: config.mcpTransport,
    port: config.mcpTransport === 'http' ? config.port : 'N/A (stdio mode)',
    hasSharedSecret: Boolean(config.sharedSecret),
  });
}
