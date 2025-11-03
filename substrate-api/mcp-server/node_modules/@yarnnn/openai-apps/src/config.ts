import * as dotenv from 'dotenv';

dotenv.config();

interface BaseConfig {
  backendUrl: string;
  port: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string): string | undefined {
  return process.env[key];
}

export interface OpenAIConfig extends BaseConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  sharedSecret?: string;
}

export const config: OpenAIConfig = {
  backendUrl: getEnv('BACKEND_URL', 'http://localhost:10000'),
  port: parseInt(getEnv('PORT', '4000'), 10),
  logLevel: (getEnv('LOG_LEVEL', 'info') as OpenAIConfig['logLevel']),
  clientId: getOptionalEnv('OPENAI_CLIENT_ID'),
  clientSecret: getOptionalEnv('OPENAI_CLIENT_SECRET'),
  redirectUri: getOptionalEnv('OPENAI_REDIRECT_URI'),
  sharedSecret: getOptionalEnv('MCP_SHARED_SECRET'),
};

export function logConfigSummary(): void {
  console.log('[CONFIG] OpenAI Apps adapter configuration loaded', {
    backendUrl: config.backendUrl,
    port: config.port,
    logLevel: config.logLevel,
    hasClientId: Boolean(config.clientId),
    hasClientSecret: Boolean(config.clientSecret),
    hasRedirectUri: Boolean(config.redirectUri),
    hasSharedSecret: Boolean(config.sharedSecret),
  });

  if (!config.clientId || !config.clientSecret || !config.redirectUri) {
    console.warn(
      '[CONFIG] OAuth credentials are not fully configured. The adapter will run in stub mode until they are provided.'
    );
  }

  if (!config.sharedSecret) {
    console.warn('[CONFIG] MCP_SHARED_SECRET not set; token persistence endpoint cannot be called.');
  }
}
