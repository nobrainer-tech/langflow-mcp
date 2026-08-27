import { afterEach, describe, expect, it } from 'vitest';
import { consolidatedTools } from '../../mcp/tools-consolidated';
import { getResourceContent } from '../../mcp/resources';
import { langflowMCPTools } from '../../mcp/tools';

describe('MCP tools resource', () => {
  const originalMode = process.env.LANGFLOW_CONSOLIDATED_TOOLS;

  afterEach(() => {
    if (originalMode === undefined) {
      delete process.env.LANGFLOW_CONSOLIDATED_TOOLS;
    } else {
      process.env.LANGFLOW_CONSOLIDATED_TOOLS = originalMode;
    }
  });

  it('reports the live standard tool registry', () => {
    delete process.env.LANGFLOW_CONSOLIDATED_TOOLS;
    const summary = JSON.parse(getResourceContent('langflow://tools').text);

    expect(summary.tool_count).toBe(langflowMCPTools.length);
    expect(summary.tools).toContain('agentic_assist_stream');
    expect(summary.tools).toContain('build_public_flow');
  });

  it('reports the live consolidated tool registry', () => {
    process.env.LANGFLOW_CONSOLIDATED_TOOLS = 'true';
    const summary = JSON.parse(getResourceContent('langflow://tools').text);

    expect(summary.tool_count).toBe(consolidatedTools.length);
    expect(summary.tools).toContain('workflow');
    expect(summary.tools).toContain('a2a');
  });
});
