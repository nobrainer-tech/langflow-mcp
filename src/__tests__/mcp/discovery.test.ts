import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LangflowMCPServer } from '../../mcp/server';
import { langflowMCPTools } from '../../mcp/tools';

function handlers() {
  const server = new LangflowMCPServer({ discovery: true });
  const requests = (server as any).server._requestHandlers;
  return {
    list: () => requests.get('tools/list')({ method: 'tools/list', params: {} }, {}),
    call: (name: string, args: Record<string, unknown> = {}) => requests.get('tools/call')({ method: 'tools/call', params: { name, arguments: args } }, {}),
    server,
  };
}
const data = (result: any) => JSON.parse(result.content[0].text);
beforeEach(() => vi.stubEnv('ENABLE_DEPRECATED_TOOLS', 'true'));
afterEach(() => vi.unstubAllEnvs());

describe('discovery tool surface', () => {
  it('advertises three small tools and works without credentials', async () => {
    vi.stubEnv('LANGFLOW_API_KEY', '');
    const h = handlers();
    const { tools } = await h.list();
    expect(tools.map((tool: any) => tool.name)).toEqual(['search_tools', 'get_tool_schema', 'call_tool']);
    expect(Buffer.byteLength(JSON.stringify(tools))).toBeLessThan(Buffer.byteLength(JSON.stringify(langflowMCPTools)) / 20);
    const result = data(await h.call('search_tools', { query: 'policy bundle' }));
    expect(result.tools.map((tool: any) => tool.name)).toContain('replace_policy_bundle');
    expect(JSON.stringify(result)).not.toContain('inputSchema');
    expect(data(await h.call('get_tool_schema', { name: 'replace_policy_bundle' }))).toEqual(langflowMCPTools.find(t => t.name === 'replace_policy_bundle'));
  });

  it('pages through every operation exactly once without dumping all schemas', async () => {
    const h = handlers();
    const names: string[] = [];
    for (let offset = 0; offset < langflowMCPTools.length; offset += 20) {
      const page = data(await h.call('search_tools', { offset, limit: 20 }));
      expect(page.tools.length).toBeLessThanOrEqual(20);
      names.push(...page.tools.map((t: any) => t.name));
    }
    expect([...names].sort()).toEqual(langflowMCPTools.map(t => t.name).sort());
    for (const name of names) expect(data(await h.call('get_tool_schema', { name })).name).toBe(name);
  });

  it('uses the existing validated handler and preserves errors', async () => {
    vi.stubEnv('LANGFLOW_BASE_URL', 'http://localhost:7860');
    vi.stubEnv('LANGFLOW_API_KEY', 'fixture-only-key');
    const h = handlers();
    const getVersion = vi.fn().mockResolvedValue({ version: '1.13.0' });
    (h.server as any).client = { getVersion };
    expect(data(await h.call('call_tool', { name: 'get_version', arguments: {} }))).toEqual({ version: '1.13.0' });
    expect(getVersion).toHaveBeenCalledOnce();
    expect((await h.call('call_tool', { name: 'get_flow', arguments: { flow_id: 'invalid' } })).isError).toBe(true);
    expect((await h.call('call_tool', { name: 'call_tool', arguments: {} })).isError).toBe(true);
    expect((await h.call('search_tools', { limit: 200 })).isError).toBe(true);
  });
});

it('keeps disabled deprecated tools out of discovery and its resource summary', async () => {
  vi.stubEnv('ENABLE_DEPRECATED_TOOLS', 'false');
  const h = handlers();
  const search = data(await h.call('search_tools', { query: 'build_vertices' }));
  expect(search.tools.map((t: any) => t.name)).not.toContain('build_vertices');
  expect((await h.call('get_tool_schema', { name: 'build_vertices' })).isError).toBe(true);
  const handler = (h.server as any).server._requestHandlers.get('resources/read');
  const summary = await handler({ method: 'resources/read', params: { uri: 'langflow://tools' } }, {});
  expect(JSON.parse(summary.contents[0].text)).toMatchObject({ mode: 'discovery', tool_count: 3, operation_count: langflowMCPTools.length - 3 });
});
