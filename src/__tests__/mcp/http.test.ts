import { createServer } from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LangflowMCPHttpServer } from '../../mcp/http';
import { LangflowMCPServer } from '../../mcp/server';

const AUTH_TOKEN = 'test-http-token-123456';

describe('LangflowMCPHttpServer', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let httpServer: LangflowMCPHttpServer;
  let baseUrl: string;

  beforeEach(async () => {
    originalEnv = { ...process.env };
    process.env.LANGFLOW_BASE_URL = 'http://localhost:7860';
    process.env.LANGFLOW_API_KEY = 'test-api-key-123';

    httpServer = new LangflowMCPHttpServer({
      host: '127.0.0.1',
      port: 0,
      authToken: AUTH_TOKEN,
      enableJsonResponse: true,
      createMcpServer: () => new LangflowMCPServer()
    });
    await httpServer.start();

    const address = httpServer.getAddress();
    if (!address) throw new Error('HTTP server did not expose a listening address');
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await httpServer.shutdown();
    process.env = originalEnv;
  });

  const initializeRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'http-test-client', version: '1.0.0' }
    }
  };

  async function post(body: unknown, sessionId?: string, token = AUTH_TOKEN): Promise<Response> {
    const headers: Record<string, string> = {
      Accept: 'application/json, text/event-stream',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    if (sessionId) headers['Mcp-Session-Id'] = sessionId;

    return fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
  }

  it('serves an unauthenticated health endpoint', async () => {
    const response = await fetch(`${baseUrl}/health`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
  });

  it('rejects an MCP request without the bearer token', async () => {
    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/event-stream',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(initializeRequest)
    });

    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toBe('Bearer');
  });

  it('rejects an Origin that is not explicitly allowed', async () => {
    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
        Origin: 'https://untrusted.example'
      },
      body: JSON.stringify(initializeRequest)
    });

    expect(response.status).toBe(403);
  });

  it('supports initialize, tools/list, and session termination', async () => {
    const initializeResponse = await post(initializeRequest);

    expect(initializeResponse.status).toBe(200);
    const sessionId = initializeResponse.headers.get('mcp-session-id');
    expect(sessionId).toBeTruthy();
    await expect(initializeResponse.json()).resolves.toMatchObject({
      jsonrpc: '2.0',
      id: 1,
      result: { serverInfo: { name: 'langflow-mcp' } }
    });

    const initializedResponse = await post(
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      sessionId ?? undefined
    );
    expect([200, 202]).toContain(initializedResponse.status);

    const toolsResponse = await post(
      { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
      sessionId ?? undefined
    );

    expect(toolsResponse.status).toBe(200);
    const toolsBody = await toolsResponse.json() as { result?: { tools?: unknown[] } };
    expect(toolsBody.result?.tools?.length).toBeGreaterThan(0);

    const deleteResponse = await fetch(`${baseUrl}/mcp`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${AUTH_TOKEN}`,
        'Mcp-Session-Id': sessionId ?? ''
      }
    });
    expect(deleteResponse.status).toBe(200);

    const afterDeleteResponse = await fetch(`${baseUrl}/mcp`, {
      headers: {
        Accept: 'text/event-stream',
        Authorization: `Bearer ${AUTH_TOKEN}`,
        'Mcp-Session-Id': sessionId ?? ''
      }
    });
    expect(afterDeleteResponse.status).toBe(404);
  });

  it('matches MCP requests by pathname when a query string is present', async () => {
    const response = await fetch(`${baseUrl}/mcp?client=codex`, {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(initializeRequest)
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('mcp-session-id')).toBeTruthy();
  });

  it('requires initialization before creating a session', async () => {
    const response = await post({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });

    expect(response.status).toBe(400);
  });

  it('rejects JSON-RPC batches at the HTTP boundary', async () => {
    const response = await post([initializeRequest]);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: -32600, message: 'Batch JSON-RPC requests are not supported' }
    });
  });

  it('uses SSE responses by default', async () => {
    const sseServer = new LangflowMCPHttpServer({
      host: '127.0.0.1',
      port: 0,
      authToken: AUTH_TOKEN,
      createMcpServer: () => new LangflowMCPServer()
    });
    await sseServer.start();

    try {
      const address = sseServer.getAddress();
      if (!address) throw new Error('SSE server did not expose a listening address');

      const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(initializeRequest)
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/event-stream');
      await expect(response.text()).resolves.toContain('"serverInfo"');
    } finally {
      await sseServer.shutdown();
    }
  });

  it('reserves session capacity while initialization is in flight', async () => {
    let releaseConnection!: () => void;
    const connectionGate = new Promise<void>(resolve => {
      releaseConnection = resolve;
    });
    const limitedServer = new LangflowMCPHttpServer({
      host: '127.0.0.1',
      port: 0,
      authToken: AUTH_TOKEN,
      maxSessions: 1,
      createMcpServer: () => ({
        connectTransport: async () => connectionGate,
        shutdown: async () => undefined
      })
    });
    await limitedServer.start();

    try {
      const address = limitedServer.getAddress();
      if (!address) throw new Error('Limited server did not expose a listening address');
      const url = `http://127.0.0.1:${address.port}/mcp`;
      const headers = {
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      };

      const firstRequest = fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(initializeRequest)
      });
      await new Promise(resolve => setImmediate(resolve));

      const secondResponse = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(initializeRequest)
      });
      expect(secondResponse.status).toBe(429);

      releaseConnection();
      await limitedServer.shutdown();
      await firstRequest.catch(() => undefined);
    } finally {
      releaseConnection();
      await limitedServer.shutdown();
    }
  });

  it('releases the session reservation when the transport rejects initialize', async () => {
    let shutdowns = 0;
    const limitedServer = new LangflowMCPHttpServer({
      host: '127.0.0.1',
      port: 0,
      authToken: AUTH_TOKEN,
      maxSessions: 1,
      enableJsonResponse: true,
      createMcpServer: () => {
        const server = new LangflowMCPServer();
        return {
          connectTransport: transport => server.connectTransport(transport),
          shutdown: async () => {
            shutdowns += 1;
            await server.shutdown();
          }
        };
      }
    });
    await limitedServer.start();

    try {
      const address = limitedServer.getAddress();
      if (!address) throw new Error('Limited server did not expose a listening address');
      const url = `http://127.0.0.1:${address.port}/mcp`;
      const initialize = (headers: Record<string, string>) => fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${AUTH_TOKEN}`, ...headers },
        body: JSON.stringify(initializeRequest)
      });

      const notAcceptable = await initialize({ Accept: 'application/json', 'Content-Type': 'application/json' });
      expect(notAcceptable.status).toBe(406);
      const unsupportedType = await initialize({ Accept: 'application/json, text/event-stream', 'Content-Type': 'text/plain' });
      expect(unsupportedType.status).toBe(415);
      expect(shutdowns).toBe(2);

      const accepted = await initialize({ Accept: 'application/json, text/event-stream', 'Content-Type': 'application/json' });
      expect(accepted.status).toBe(200);
      expect(accepted.headers.get('mcp-session-id')).toBeTruthy();
    } finally {
      await limitedServer.shutdown();
    }
  });

  it('does not count an open standalone SSE stream against the request limit', async () => {
    const limitedServer = new LangflowMCPHttpServer({
      host: '127.0.0.1',
      port: 0,
      authToken: AUTH_TOKEN,
      maxConcurrentRequests: 1,
      enableJsonResponse: true,
      createMcpServer: () => new LangflowMCPServer()
    });
    await limitedServer.start();
    const streamController = new AbortController();

    try {
      const address = limitedServer.getAddress();
      if (!address) throw new Error('Limited server did not expose a listening address');
      baseUrl = `http://127.0.0.1:${address.port}`;

      const initializeResponse = await post(initializeRequest);
      const sessionId = initializeResponse.headers.get('mcp-session-id');
      if (!sessionId) throw new Error('Initialize response did not include a session ID');
      expect((await post({ jsonrpc: '2.0', method: 'notifications/initialized' }, sessionId)).status).toBe(202);

      const stream = await fetch(`${baseUrl}/mcp`, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          Authorization: `Bearer ${AUTH_TOKEN}`,
          'Mcp-Session-Id': sessionId
        },
        signal: streamController.signal
      });
      expect(stream.status).toBe(200);
      expect(stream.headers.get('content-type')).toContain('text/event-stream');

      const toolsResponse = await post({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }, sessionId);
      expect(toolsResponse.status).toBe(200);
    } finally {
      streamController.abort();
      await limitedServer.shutdown();
    }
  });

  it('answers an in-flight call and aborts its upstream request when the session is deleted', async () => {
    let upstreamAborted!: () => void;
    const aborted = new Promise<void>(resolve => { upstreamAborted = resolve; });
    let upstreamReached!: () => void;
    const reached = new Promise<void>(resolve => { upstreamReached = resolve; });
    const upstream = createServer((req, res) => {
      upstreamReached();
      res.on('close', () => { if (!res.writableEnded) upstreamAborted(); });
    });
    await new Promise<void>(resolve => upstream.listen(0, '127.0.0.1', resolve));
    const upstreamAddress = upstream.address();
    if (!upstreamAddress || typeof upstreamAddress === 'string') throw new Error('No upstream port');
    process.env.LANGFLOW_BASE_URL = `http://127.0.0.1:${upstreamAddress.port}`;

    const limitedServer = new LangflowMCPHttpServer({
      host: '127.0.0.1',
      port: 0,
      authToken: AUTH_TOKEN,
      maxConcurrentRequests: 2,
      enableJsonResponse: true,
      createMcpServer: () => new LangflowMCPServer()
    });
    await limitedServer.start();

    try {
      const address = limitedServer.getAddress();
      if (!address) throw new Error('Limited server did not expose a listening address');
      baseUrl = `http://127.0.0.1:${address.port}`;

      const sessionId = (await post(initializeRequest)).headers.get('mcp-session-id');
      if (!sessionId) throw new Error('Initialize response did not include a session ID');
      await post({ jsonrpc: '2.0', method: 'notifications/initialized' }, sessionId);

      const call = post({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'get_version', arguments: {} } }, sessionId);
      await reached;
      const deleted = await fetch(`${baseUrl}/mcp`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${AUTH_TOKEN}`, 'Mcp-Session-Id': sessionId }
      });
      expect(deleted.status).toBe(200);

      const pending = await call;
      expect(pending.status).toBe(404);
      await aborted;

      // Both request slots are free again.
      expect((await post(initializeRequest)).status).toBe(200);
    } finally {
      await limitedServer.shutdown();
      upstream.closeAllConnections();
      await new Promise<void>(resolve => upstream.close(() => resolve()));
    }
  });

  it('rejects an unsafe aggregate body limit', () => {
    expect(() => new LangflowMCPHttpServer({
      host: '127.0.0.1',
      port: 0,
      maxConcurrentBodyBytes: 20 * 1024 * 1024 - 1,
      createMcpServer: () => new LangflowMCPServer()
    })).toThrow('maxConcurrentBodyBytes must be at least 20971520');
  });

  it('returns 404 for unknown routes', async () => {
    const response = await fetch(`${baseUrl}/not-mcp`);

    expect(response.status).toBe(404);
  });
});
