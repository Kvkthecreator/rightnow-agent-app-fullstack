#!/usr/bin/env node

/**
 * MCP Auth Proxy for Inspector
 *
 * MCP Inspector doesn't properly pass custom headers to StreamableHttp transport.
 * This proxy adds the Authorization header automatically.
 *
 * Usage:
 *   node mcp-auth-proxy.js
 *
 * Then configure Inspector to connect to: http://localhost:3333
 */

import http from 'http';
import https from 'https';

const TARGET = 'https://mcp.yarnnn.com';
const TOKEN = 'Bearer V3_UZKgbQq1dWkbnBnFWKwQhsG48LGB6VIQTvfOAR05trDD5ZaYElfcTVqU2bxmv';
const PORT = 3333;

const server = http.createServer((req, res) => {
  console.log(`[Proxy] ${req.method} ${req.url}`);

  // Collect request body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    // Forward request to target with auth header
    const options = {
      method: req.method,
      headers: {
        ...req.headers,
        'Authorization': TOKEN,
        'host': 'mcp.yarnnn.com',
      },
    };

    const targetReq = https.request(TARGET + req.url, options, (targetRes) => {
      console.log(`[Proxy] Response: ${targetRes.statusCode}`);

      // Forward response headers
      res.writeHead(targetRes.statusCode, targetRes.headers);

      // Forward response body
      targetRes.pipe(res);
    });

    targetReq.on('error', (error) => {
      console.error('[Proxy] Error:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Proxy error', details: error.message }));
    });

    // Send request body
    if (body) {
      targetReq.write(body);
    }
    targetReq.end();
  });
});

server.listen(PORT, () => {
  console.log(`\n🔐 MCP Auth Proxy running on http://localhost:${PORT}`);
  console.log(`📡 Forwarding to: ${TARGET}`);
  console.log(`🔑 Adding auth token automatically\n`);
  console.log(`Configure MCP Inspector to connect to: http://localhost:${PORT}\n`);
});
