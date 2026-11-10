import { createServer, Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LangflowClient } from '../../services/langflow-client';

let server: Server;
let client: LangflowClient;
let baseUrl: string;
let hits: string[];
let logStream: 'open' | 'disabled' | 'reset';
let received: { method?: string; headers: Record<string, unknown>; body: string; url: string };
beforeEach(async () => {
  hits = [];
  logStream = 'open';
  server = createServer(async (req, res) => {
    hits.push(req.url!);
    let body = '';
    for await (const chunk of req) body += chunk.toString();
    received = { method: req.method, headers: req.headers, body, url: req.url! };
    if (req.url?.endsWith('/redirect')) { res.writeHead(302, { Location: `${baseUrl}/api/v1/redirect-target` }); res.end(); }
    else if (req.url?.endsWith('/binary')) { res.setHeader('Content-Type', 'application/octet-stream'); res.end(Buffer.from([0, 255])); }
    else if (req.url?.endsWith('/events')) { res.setHeader('Content-Type', 'text/event-stream'); res.end('data: {"done":true}\n\n'); }
    else if (req.url?.endsWith('/empty')) { res.writeHead(204); res.end(); }
    else if (req.url?.endsWith('/plain')) { res.writeHead(201, { 'Content-Type': 'text/plain' }); res.end('created'); }
    else if (req.url?.endsWith('/logs-stream') && logStream === 'disabled') { res.writeHead(501, { 'Content-Type': 'application/json' }); res.end('{"detail":"Log retrieval is disabled"}'); }
    else if (req.url?.endsWith('/logs-stream')) {
      res.setHeader('Content-Type', 'text/event-stream'); res.write('data: {"line":1}\n\n');
      if (logStream === 'reset') setTimeout(() => res.destroy(), 30);
    }
    else { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ accepted: true })); }
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No fixture port');
  baseUrl = `http://127.0.0.1:${address.port}`;
  client = new LangflowClient({ baseUrl: `${baseUrl}/prefix`, apiKey: 'wire-fixture-only', timeout: 2000 });
});
afterEach(async () => { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); });

describe('API transport security and serialization', () => {
  it('keeps the configured prefix, repeats bare query keys and sends JSON unchanged', async () => {
    const result = await client.requestApi({ method: 'POST', path: '/api/v1/triggers', query: { names: ['a b', '日本語'], enabled: false, offset: 0 }, body: { enabled: false }, headers: { 'If-Match': '2' } });
    expect(result.body).toEqual({ accepted: true });
    const url = new URL(received.url, baseUrl);
    expect(url.pathname).toBe('/prefix/api/v1/triggers');
    expect(url.searchParams.getAll('names')).toEqual(['a b', '日本語']);
    expect(url.searchParams.get('offset')).toBe('0');
    expect(received.headers['x-api-key']).toBe('wire-fixture-only');
    expect(received.headers['if-match']).toBe('2');
    expect(JSON.parse(received.body)).toEqual({ enabled: false });
    expect(hits).toHaveLength(1);
  });

  it('never follows a redirect or retries a write', async () => {
    await expect(client.requestApi({ method: 'POST', path: '/api/v1/redirect', body: { value: 1 } })).rejects.toThrow('HTTP 302');
    expect(hits).toEqual(['/prefix/api/v1/redirect']);
  });

  it('sends URL-encoded forms and multipart bytes without path-based file reads', async () => {
    await client.requestApi({ method: 'POST', path: '/api/v1/form', encoding: 'form', body: { ids: ['a', 'b'], enabled: false } });
    expect(received.headers['content-type']).toBe('application/x-www-form-urlencoded');
    expect(new URLSearchParams(received.body).getAll('ids')).toEqual(['a', 'b']);
    await client.requestApi({ method: 'POST', path: '/api/v2/files/', encoding: 'multipart', body: { overwrite: false }, files: [{ field: 'file', name: 'sample.txt', content_base64: 'aGVsbG8=' }] });
    expect(received.headers['content-type']).toMatch(/^multipart\/form-data; boundary=/);
    expect(received.body).toContain('filename="sample.txt"');
    expect(received.body).toContain('hello');
    expect(received.body).toContain('false');
  });

  it('returns binary, finite event streams and empty responses explicitly', async () => {
    expect(await client.requestApi({ method: 'GET', path: '/api/v1/binary', response_format: 'base64' })).toMatchObject({ body: 'AP8=', encoding: 'base64' });
    expect(await client.requestApi({ method: 'GET', path: '/api/v1/events', response_format: 'text' })).toMatchObject({ body: 'data: {"done":true}\n\n', encoding: 'text' });
    expect(await client.requestApi({ method: 'DELETE', path: '/api/v1/empty' })).toMatchObject({ status: 204, body: null });
  });

  it('reports a successful non-JSON response as text instead of failing after the write', async () => {
    expect(await client.requestApi({ method: 'POST', path: '/api/v1/plain', body: { value: 1 } }))
      .toMatchObject({ status: 201, encoding: 'text', body: 'created' });
    expect(hits).toHaveLength(1);
  });

  it('returns a bounded window of the log stream and closes the upstream connection', async () => {
    const closed = new Promise<void>(resolve => server.once('request', (_req, res) => res.on('close', () => resolve())));
    expect(await client.getLogs(true, 100)).toEqual({ window_ms: 100, truncated: false, events: 'data: {"line":1}\n\n' });
    await closed;
  });

  it('reports a failed log stream without leaking request internals or the API key', async () => {
    logStream = 'disabled';
    const error = await client.getLogs(true, 100).catch(e => e as Error);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Failed to get logs: HTTP 501 - {"detail":"Log retrieval is disabled"}');
    expect(error.message).not.toContain('wire-fixture-only');
  });

  it('never serializes a stream response into an error message', async () => {
    logStream = 'disabled';
    const raw = await (client as any).client.get('/logs-stream', { baseURL: `${baseUrl}/prefix`, responseType: 'stream' }).catch((e: unknown) => e);
    const message = (client as any).handleError(raw, 'Failed').message;
    expect(message).toBe('Failed: HTTP 501 - "[stream]"');
  });

  it('fails when the log stream breaks before the window ends', async () => {
    logStream = 'reset';
    await expect(client.getLogs(true, 2000)).rejects.toThrow('Failed to get logs');
  });

  it('keeps policy replacement and interactive password-reset guards on raw API calls', async () => {
    for (const path of ['/api/v1/policy-bundle', '/api/v1/%70olicy-bundle']) {
      await expect(client.requestApi({ method: 'PUT', path, body: { expected_revision: 1 } })).rejects.toThrow('explicit arrays');
    }
    await expect(client.requestApi({ method: 'PATCH', path: '/api/v1/users/id/reset-password', body: { new_password: 'fixture-only' } })).rejects.toThrow('interactive_login_required');
    for (const path of ['/api/v1//policy-bundle', '/api//v1/policy-bundle', '/api/v1/users//id/reset-password']) {
      await expect(client.requestApi({ method: 'PUT', path, body: { expected_revision: 1 } })).rejects.toThrow('Unsafe API path');
    }
    expect(hits).toEqual([]);
  });
});
