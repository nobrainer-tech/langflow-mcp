import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ZodError } from 'zod';
import { langflowMCPTools } from './tools';
import { logger } from '../utils/logger';
import { LangflowClient } from '../services/langflow-client';
import { LangflowConfig } from '../types';
import {
  CreateFlowSchema,
  ListFlowsSchema,
  GetFlowSchema,
  UpdateFlowSchema,
  DeleteFlowSchema,
  DeleteFlowsSchema,
  ListComponentsSchema
} from './validation';

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

  private formatSuccessResponse(data: any): any {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  private formatErrorResponse(error: unknown, toolName: string): any {
    logger.error(`Error executing tool ${toolName}:`, error);

    let errorMessage: string;
    let errorDetails: Record<string, any> = {};

    if (error instanceof ZodError) {
      errorMessage = 'Validation error';
      errorDetails = {
        issues: error.issues.map((issue) => ({
          path: Array.isArray(issue.path) ? issue.path.join('.') : '',
          message: issue.message
        }))
      };
    } else if (error instanceof Error) {
      errorMessage = error.message;
      if (error.stack) {
        errorDetails.stack = error.stack.split('\n').slice(0, 3);
      }
    } else {
      errorMessage = 'Unknown error';
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: true,
            message: errorMessage,
            tool: toolName,
            timestamp: new Date().toISOString(),
            ...errorDetails
          }, null, 2)
        }
      ],
      isError: true
    };
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

      const { name, arguments: rawArgs } = request.params;
      const args = (rawArgs ?? {}) as Record<string, unknown>;

      try {
        switch (name) {
          case 'create_flow': {
            const validated = CreateFlowSchema.parse(args);
            const created = await this.client.createFlow(validated);
            return this.formatSuccessResponse(created);
          }

          case 'list_flows': {
            const validated = ListFlowsSchema.parse(args);
            const flows = await this.client.listFlows(validated);
            return this.formatSuccessResponse(flows);
          }

          case 'get_flow': {
            const validated = GetFlowSchema.parse(args);
            const flow = await this.client.getFlow(validated.flow_id);
            return this.formatSuccessResponse(flow);
          }

          case 'update_flow': {
            const validated = UpdateFlowSchema.parse(args);
            const { flow_id, ...updates } = validated;
            const updated = await this.client.updateFlow(flow_id, updates);
            return this.formatSuccessResponse(updated);
          }

          case 'delete_flow': {
            const validated = DeleteFlowSchema.parse(args);
            await this.client.deleteFlow(validated.flow_id);
            return this.formatSuccessResponse({
              success: true,
              message: 'Flow deleted successfully'
            });
          }

          case 'delete_flows': {
            const validated = DeleteFlowsSchema.parse(args);
            const result = await this.client.deleteFlows(validated.flow_ids);
            return this.formatSuccessResponse(result);
          }

          case 'list_components': {
            ListComponentsSchema.parse(args);
            const components = await this.client.listComponents();
            return this.formatSuccessResponse(components);
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return this.formatErrorResponse(error, name);
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
