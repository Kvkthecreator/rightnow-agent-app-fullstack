import { IncomingMessage, ServerResponse } from 'node:http';

export function handleHealth(_req: IncomingMessage, res: ServerResponse): void {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ status: 'ok', service: 'apps/chatgpt' }));
}
