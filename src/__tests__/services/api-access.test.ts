import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import MockAdapter from 'axios-mock-adapter';
import { LangflowClient } from '../../services/langflow-client';
import { logger, setLogLevel } from '../../utils/logger';

// Shapes from Langflow v1.13.0 (63082cf9), docs/openapi/openapi.json.
const spec = {
  openapi: '3.1.0', info: { version: '1.13.0' },
  paths: {
    '/api/v1/connections': { get: { summary: 'List Connections', responses: { '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/Connection' } } } } } } },
    '/api/v1/triggers/{trigger_id}/enable': { post: { summary: 'Enable Trigger', parameters: [{ name: 'trigger_id', in: 'path', required: true, schema: { type: 'string' } }] } },
  },
  components: { schemas: { Connection: { type: 'object', properties: { details: { $ref: '#/components/schemas/Details' } } }, Details: { type: 'object' }, Unrelated: { type: 'string' } } },
};
let client: LangflowClient;
let mock: MockAdapter;
beforeEach(() => {
  client = new LangflowClient({ baseUrl: 'https://langflow.example.test/prefix', apiKey: 'fixture-only-key' });
  mock = new MockAdapter((client as any).client);
});
afterEach(() => mock.restore());

describe('live Langflow API access', () => {
  it('searches the connected schema and returns only selected schema references', async () => {
    mock.onGet('/openapi.json').reply(200, spec);
    const search = await client.getApiSchema({ query: 'trigger' });
    expect(search.operations).toHaveLength(1);
    if (!Array.isArray(search.operations)) throw new Error('Expected operation summaries');
    expect(search.operations[0].path).toBe('/api/v1/triggers/{trigger_id}/enable');
    const detail = await client.getApiSchema({ path: '/api/v1/connections', method: 'GET' });
    expect(Object.keys(detail.components!.schemas).sort()).toEqual(['Connection', 'Details']);
    expect(mock.history.get[0].baseURL).toBe('https://langflow.example.test/prefix');
    expect(mock.history.get[0].maxRedirects).toBe(0);
  });

  it('forwards new API operations, revision headers and pagination without changing values', async () => {
    mock.onPatch('/api/v1/connections/id').reply(200, Buffer.from('{"id":"id"}'), { 'content-type': 'application/json' });
    const response = await client.requestApi({ method: 'PATCH', path: '/api/v1/connections/id', query: { offset: 200, limit: 0 }, body: { enabled: false }, headers: { 'If-Match': 'revision-2' } });
    expect(response).toMatchObject({ status: 200, body: { id: 'id' } });
    expect(mock.history.patch[0]).toMatchObject({ baseURL: 'https://langflow.example.test/prefix', maxRedirects: 0, params: { offset: 200, limit: 0 } });
    expect(JSON.parse(mock.history.patch[0].data)).toEqual({ enabled: false });
    expect(mock.history.patch[0].headers?.['x-api-key']).toBe('fixture-only-key');
  });

  it.each(['https://evil.test/api/v1/flows','//evil.test/api/v1/flows','/api/../secret','/api/%2e%2e/secret','/api/%252e%252e/secret','/api/v1/flows?x=1','/api/v1/flows#x','/api\\evil','/other'])('rejects an unsafe path %s before requesting', async path => {
    await expect(client.requestApi({ method: 'GET', path })).rejects.toThrow();
    expect(mock.history).toHaveLength(0);
  });

  it.each(['Authorization', 'Cookie', 'x-api-key', 'Host', 'Proxy-Authorization', 'Content-Length'])('rejects credential/transport override %s', async header => {
    await expect(client.requestApi({ method: 'GET', path: '/api/v1/flows', headers: { [header]: 'private-value' } })).rejects.toThrow();
    expect(mock.history).toHaveLength(0);
  });

  it('preserves upstream refusals without echoing request bodies or secrets', async () => {
    mock.onPost('/api/v1/triggers').reply(403, { password: 'private-value' });
    await expect(client.requestApi({ method: 'POST', path: '/api/v1/triggers', body: { password: 'private-value' } })).rejects.toThrow('HTTP 403');
    try { await client.requestApi({ method: 'POST', path: '/api/v1/triggers' }); } catch (e) { expect(String(e)).not.toContain('private-value'); }
  });

  it('supports binary downloads and multipart uploads without local file access', async () => {
    mock.onGet('/api/v2/files/id').reply(200, Buffer.from([0, 1, 255]), { 'content-type': 'application/octet-stream' });
    expect(await client.requestApi({ method: 'GET', path: '/api/v2/files/id', response_format: 'base64' })).toMatchObject({ body: 'AAH/', encoding: 'base64' });
    mock.onPost('/api/v2/files/').reply(201, Buffer.from('{"id":"upload"}'), { 'content-type': 'application/json' });
    expect(await client.requestApi({ method: 'POST', path: '/api/v2/files/', encoding: 'multipart', files: [{ field: 'file', name: 'fixture.txt', content_base64: 'aGk=' }] })).toMatchObject({ status: 201 });
    expect(mock.history.post[0].headers?.['Content-Type']).toMatch(/^multipart\/form-data; boundary=/);
  });
});

it('keeps recursive references finite and refuses external schema references', async () => {
  const copy = JSON.parse(JSON.stringify(spec));
  copy.components.schemas.Details.properties = { parent: { $ref: '#/components/schemas/Connection' } };
  mock.onGet('/openapi.json').reply(200, copy);
  expect((await client.getApiSchema({ path: '/api/v1/connections', method: 'GET' })).components).toHaveProperty('schemas.Details');
  copy.components.schemas.Details.properties.parent.$ref = 'https://outside.example/schema';
  await expect(client.getApiSchema({ path: '/api/v1/connections' })).rejects.toThrow('local OpenAPI');
  expect(mock.history).toHaveLength(2);
});

it('rejects malformed base64 and header injection before HTTP', async () => {
  await expect(client.requestApi({ method: 'POST', path: '/api/v2/files/', encoding: 'multipart', files: [{ field: 'file', name: 'f', content_base64: 'invalid!' }] })).rejects.toThrow('base64');
  await expect(client.requestApi({ method: 'POST', path: '/api/v1/run/id', headers: { Accept: 'text/plain\r\nHost: outside.example' } })).rejects.toThrow();
  expect(mock.history).toHaveLength(0);
});

it.each(['http', 'timeout'])('does not expose credentials in nested logs after a schema %s failure', async failure => {
  if (failure === 'http') mock.onGet('/openapi.json').reply(403, { detail: 'private-response' });
  else mock.onGet('/openapi.json').timeout();
  const stderr = vi.spyOn(console, 'error').mockImplementation(() => {});
  setLogLevel('error');
  try {
    const error = await client.getApiSchema().catch(error => error);
    expect(error).toBeInstanceOf(Error);
    logger.error('Schema fetch failed', { error });
    expect(stderr).toHaveBeenCalledOnce();
    expect(JSON.stringify(stderr.mock.calls)).not.toContain('fixture-only-key');
    expect(JSON.stringify(error)).not.toContain('private-response');
    expect(error.message).toContain(failure === 'http' ? 'HTTP 403' : 'network, timeout or size limit');
  } finally {
    stderr.mockRestore();
    setLogLevel(process.env.LOG_LEVEL || 'info');
  }
});

it.each(['GET', 'POST'] as const)('preserves inline definitions in the upstream %s workflows contract', async method => {
  const upstream = JSON.parse(readFileSync('full_openapi_1.9.5.json', 'utf8'));
  const path = '/api/v2/workflows';
  mock.onGet('/openapi.json').reply(200, upstream);
  const result = await client.getApiSchema({ path, method });
  if (Array.isArray(result.operations)) throw new Error('Expected an operation contract');
  expect(result.operations[method.toLowerCase()]).toEqual(upstream.paths[path][method.toLowerCase()]);
  expect(JSON.stringify(result.operations)).toContain('#/$defs/JobStatus');
});
