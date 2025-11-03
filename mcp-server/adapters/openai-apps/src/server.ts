import 'dotenv/config';
import http, { IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';

import { handleHealth } from './routes/health.js';
import { handleActions } from './routes/actions.js';
import { handleOAuth } from './routes/oauth.js';
import { logger } from './lib/logger.js';

const port = Number(process.env.PORT || 4312);

async function router(req: IncomingMessage, res: ServerResponse) {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

    if (url.pathname === '/healthz' || url.pathname === '/readyz') {
      return handleHealth(req, res);
    }

    if (url.pathname.startsWith('/oauth')) {
      return handleOAuth(req, res);
    }

    if (url.pathname.startsWith('/actions')) {
      return handleActions(req, res);
    }

    res.statusCode = 404;
    res.end('Not found');
  } catch (error) {
    logger.error('Request handling failed', { error });
    res.statusCode = 500;
    res.end('Internal error');
  }
}

const server = http.createServer((req, res) => {
  void router(req, res);
});

server.listen(port, () => {
  logger.info('ChatGPT app server listening', { port });
});

export default server;
