import { afterEach, describe, expect, it, vi } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { LangflowMCPServer } from '../../mcp/server';

const SECRET = 'fixture-secret-key-7f3a';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('tool error logging', () => {
  it('does not log secrets carried by a raw client error', async () => {
    vi.stubEnv('LANGFLOW_BASE_URL', 'http://localhost:7860');
    vi.stubEnv('LANGFLOW_API_KEY', SECRET);
    const server = new LangflowMCPServer();
    const headers = new AxiosHeaders({ 'x-api-key': SECRET });
    const raw = new AxiosError('Request failed', 'ERR_BAD_RESPONSE', { headers } as any);
    (server as any).client = { getVersion: vi.fn().mockRejectedValue(raw) };
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    const call = (server as any).server._requestHandlers.get('tools/call');
    const result = await call({ method: 'tools/call', params: { name: 'get_version', arguments: {} } }, {});

    expect(result.isError).toBe(true);
    const logged = log.mock.calls.flat().join('\n');
    expect(logged).toContain('get_version');
    expect(logged).not.toContain(SECRET);
    expect(result.content[0].text).not.toContain(SECRET);
  });
});
