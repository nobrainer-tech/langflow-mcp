import { discoveryTools, getToolMode, ToolMode } from './discovery';
import { getAvailableTools } from './tools';
import { resolveLangflowTimeout } from '../utils/timeout';
import { consolidatedTools } from './tools-consolidated';

export interface McpResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const langflowResources: McpResource[] = [
  {
    uri: 'langflow://config',
    name: 'Langflow Connection Config',
    description: 'Current Langflow MCP server connection configuration (base URL, timeout, mode).',
    mimeType: 'application/json',
  },
  {
    uri: 'langflow://health',
    name: 'Langflow Health Status',
    description: 'Connection info and pointer to the health_check tool for live status.',
    mimeType: 'application/json',
  },
  {
    uri: 'langflow://tools',
    name: 'Available Tools Summary',
    description: 'Summary of all available MCP tools with their descriptions.',
    mimeType: 'application/json',
  },
];

export function getResourceContent(uri: string, toolMode: ToolMode = getToolMode()): {
  uri: string;
  mimeType: string;
  text: string;
} {
  switch (uri) {
    case 'langflow://config': {
      const config = {
        base_url: process.env.LANGFLOW_BASE_URL || 'not configured',
        timeout: resolveLangflowTimeout(),
        mode: process.env.MCP_MODE || 'stdio',
        tool_mode: toolMode,
        consolidated_tools: toolMode === 'consolidated',
        deprecated_tools_enabled: process.env.ENABLE_DEPRECATED_TOOLS !== 'false',
        log_level: process.env.LOG_LEVEL || 'info',
        api_key_configured: !!process.env.LANGFLOW_API_KEY,
      };
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(config, null, 2),
      };
    }

    case 'langflow://health': {
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({
          info: toolMode === 'discovery'
            ? 'Use call_tool with name health_check and empty arguments for live Langflow health.'
            : 'Use the health_check operation (system action health_check in consolidated mode) for live Langflow health.',
          base_url: process.env.LANGFLOW_BASE_URL || 'not configured',
          api_key_configured: !!process.env.LANGFLOW_API_KEY,
        }, null, 2),
      };
    }

    case 'langflow://tools': {
      const tools = toolMode === 'discovery' ? discoveryTools : toolMode === 'consolidated' ? consolidatedTools : getAvailableTools();
      const summary = { mode: toolMode, tool_count: tools.length, tools: tools.map(tool => tool.name),
        ...(toolMode === 'discovery' ? { operation_count: getAvailableTools().length, discovery: 'Use search_tools, get_tool_schema and call_tool. Live API operations are available through get_api_schema and request_api.' } : {}),
      };
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(summary, null, 2),
      };
    }

    default:
      return {
        uri,
        mimeType: 'text/plain',
        text: `Unknown resource: ${uri}`,
      };
  }
}
