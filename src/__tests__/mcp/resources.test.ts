import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { consolidatedTools } from '../../mcp/tools-consolidated';
import { getResourceContent } from '../../mcp/resources';
import { langflowMCPTools } from '../../mcp/tools';

describe('MCP tools resource', () => {
  beforeEach(() => {
    vi.stubEnv('LANGFLOW_TOOL_MODE', undefined);
    vi.stubEnv('ENABLE_DEPRECATED_TOOLS', 'true');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('reports the live standard tool registry', () => {
    vi.stubEnv('LANGFLOW_CONSOLIDATED_TOOLS', 'false');
    const summary = JSON.parse(getResourceContent('langflow://tools').text);

    expect(summary.tool_count).toBe(langflowMCPTools.length);
    expect(summary.tools).toContain('agentic_assist_stream');
    expect(summary.tools).toContain('build_public_flow');
  });

  it('reports the timeout the servers actually use', () => {
    vi.stubEnv('LANGFLOW_TIMEOUT', '400000');
    expect(JSON.parse(getResourceContent('langflow://config').text).timeout).toBe(30000);
    vi.stubEnv('LANGFLOW_TIMEOUT', '60000');
    expect(JSON.parse(getResourceContent('langflow://config').text).timeout).toBe(60000);
  });

  it('reports the live consolidated tool registry', () => {
    vi.stubEnv('LANGFLOW_CONSOLIDATED_TOOLS', 'true');
    const summary = JSON.parse(getResourceContent('langflow://tools').text);

    expect(summary.tool_count).toBe(consolidatedTools.length);
    expect(summary.tools).toContain('workflow');
    expect(summary.tools).toContain('a2a');
  });
});
