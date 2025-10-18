import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { langflowMCPTools } from './tools';
import { logger } from '../utils/logger';
import { LangflowClient } from '../services/langflow-client';
import { LangflowConfig } from '../types';

export class LangflowMCPServer {
  private server: Server;
  private client: LangflowClient | null = null;

  constructor() {
    const baseUrl = process.env.LANGFLOW_BASE_URL;
    const apiKey = process.env.LANGFLOW_API_KEY;

    if (!baseUrl || !apiKey) {
      throw new Error('LANGFLOW_BASE_URL and LANGFLOW_API_KEY must be set in environment');
    }

    const config: LangflowConfig = {
      baseUrl,
      apiKey,
      timeout: parseInt(process.env.LANGFLOW_TIMEOUT || '30000', 10)
    };

    this.client = new LangflowClient(config);

    logger.info('Initializing Langflow MCP server');

    this.server = new Server(
      {
        name: 'langflow-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: langflowMCPTools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (!this.client) {
        throw new Error('Langflow client not initialized');
      }

      const { name, arguments: args } = request.params;

      if (!args) {
        throw new Error('No arguments provided');
      }

      try {
        switch (name) {
          case 'create_flow':
            const created = await this.client.createFlow({
              name: args.name as string,
              description: args.description as string | undefined,
              data: args.data,
              folder_id: args.folder_id as string | undefined
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(created, null, 2)
                }
              ]
            };

          case 'list_flows':
            const flows = await this.client.listFlows({
              page: args.page as number | undefined,
              size: args.size as number | undefined,
              folder_id: args.folder_id as string | undefined,
              components_only: args.components_only as boolean | undefined,
              get_all: args.get_all as boolean | undefined
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(flows, null, 2)
                }
              ]
            };

          case 'get_flow':
            const flow = await this.client.getFlow(args.flow_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(flow, null, 2)
                }
              ]
            };

          case 'update_flow':
            const updated = await this.client.updateFlow(
              args.flow_id as string,
              {
                name: args.name as string | undefined,
                description: args.description as string | undefined,
                data: args.data,
                folder_id: args.folder_id as string | undefined
              }
            );
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(updated, null, 2)
                }
              ]
            };

          case 'delete_flow':
            await this.client.deleteFlow(args.flow_id as string);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ success: true, message: 'Flow deleted' })
                }
              ]
            };

          case 'delete_flows':
            const result = await this.client.deleteFlows(args.flow_ids as string[]);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };

          case 'list_components':
            const components = await this.client.listComponents();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(components, null, 2)
                }
              ]
            };

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        logger.error(`Error executing tool ${name}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: error instanceof Error ? error.message : 'Unknown error'
              })
            }
          ],
          isError: true
        };
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('Langflow MCP server running on stdio');
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Langflow MCP server');
    await this.server.close();
  }
}
