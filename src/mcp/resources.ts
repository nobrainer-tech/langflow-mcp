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

export function getResourceContent(uri: string): {
  uri: string;
  mimeType: string;
  text: string;
} {
  switch (uri) {
    case 'langflow://config': {
      const config = {
        base_url: process.env.LANGFLOW_BASE_URL || 'not configured',
        timeout: parseInt(process.env.LANGFLOW_TIMEOUT || '30000', 10),
        mode: process.env.MCP_MODE || 'stdio',
        consolidated_tools: process.env.LANGFLOW_CONSOLIDATED_TOOLS === 'true',
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
          info: 'Use the health_check tool to get live health status from the Langflow instance.',
          base_url: process.env.LANGFLOW_BASE_URL || 'not configured',
          api_key_configured: !!process.env.LANGFLOW_API_KEY,
        }, null, 2),
      };
    }

    case 'langflow://tools': {
      const isConsolidated = process.env.LANGFLOW_CONSOLIDATED_TOOLS === 'true';
      const summary = isConsolidated
        ? {
            mode: 'consolidated',
            tool_count: 15,
            tools: [
              'flow', 'flow_execution', 'build', 'folder', 'project',
              'variable', 'knowledge_base', 'file', 'monitor', 'user',
              'auth', 'store', 'registration', 'validation', 'system',
            ],
          }
        : {
            mode: 'standard',
            tool_count: 93,
            categories: [
              'Flow Management (6)', 'Flow Execution (2)', 'Import/Export (3)',
              'Folder Management (5)', 'Project Management (7)', 'Variable Management (4)',
              'Build Operations (3)', 'Knowledge Base (4)', 'Component Discovery (1)',
              'File Management (5)', 'Monitoring & Analytics (9)', 'User Management (5)',
              'API Key Management (3)', 'Custom Components (2)', 'Authentication (4)',
              'Store & Marketplace (6)', 'Validation (2)', 'Advanced Execution (3)',
              'Batch & Public (3)', 'Folder Operations (2)', 'Starter & Templates (2)',
              'Profile & Media (2)', 'Integration (1)', 'System & Health (3)',
            ],
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
