#!/usr/bin/env node
/**
 * Health check script for langflow-mcp-server
 *
 * For stdio mode: Always returns success (stdio doesn't have health endpoint)
 * For HTTP mode: Checks if server responds on configured PORT
 */

const http = require('http');

const mode = process.env.MCP_MODE || 'stdio';
const port = process.env.PORT || 3000;

if (mode !== 'http') {
  // STDIO mode - always healthy
  process.exit(0);
}

// HTTP mode - check health endpoint
const options = {
  hostname: 'localhost',
  port: port,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  process.exit(res.statusCode === 200 ? 0 : 1);
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
